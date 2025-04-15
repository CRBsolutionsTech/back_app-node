"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/usersRoutes.ts
var usersRoutes_exports = {};
__export(usersRoutes_exports, {
  registerUserRoutes: () => registerUserRoutes
});
module.exports = __toCommonJS(usersRoutes_exports);

// src/supabaseConnection.ts
var import_supabase_js = require("@supabase/supabase-js");
var import_dotenv = __toESM(require("dotenv"));
import_dotenv.default.config();
var supabaseUrl = process.env.SUPABASE_URL || "";
var supabaseKey = process.env.SUPABASE_KEY || "";
var supabase = (0, import_supabase_js.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  global: { fetch },
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// src/utils/auth.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var SECRET_KEY = "seu_segredo_super_seguro";
var hashPassword = async (password) => {
  return await import_bcryptjs.default.hash(password, 10);
};
var comparePassword = async (password, hashedPassword) => {
  return await import_bcryptjs.default.compare(password, hashedPassword);
};
var generateToken = (payload) => {
  return import_jsonwebtoken.default.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};

// src/routes/usersRoutes.ts
async function registerUserRoutes(app) {
  app.get("/users", async (_, reply) => {
    const { data, error } = await supabase.from("users").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ users: data });
  });
  app.post("/users", async (request, reply) => {
    const { name, email, password, registro, cpf, celular } = request.body;
    if (!name || !email || !password || !registro || !cpf || !celular) {
      return reply.status(400).send({ error: "Todos os campos s\xE3o obrigat\xF3rios." });
    }
    const hashedPassword = await hashPassword(password);
    const status = "1";
    const { data, error } = await supabase.from("users").insert([{ name, email, password: hashedPassword, registro, cpf, celular, status }]).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.status(201).send({ users: data?.[0] });
  });
  app.put("/users/:cpf", async (request, reply) => {
    const { cpf } = request.params;
    const { name, email, password, registro, celular, status } = request.body;
    const updateData = {
      ...name && { name },
      ...email && { email },
      ...password && { password: await hashPassword(password) },
      ...registro && { registro },
      ...celular && { celular },
      ...status && { status }
    };
    const { data, error } = await supabase.from("users").update(updateData).eq("cpf", cpf).select();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ message: "Usu\xE1rio atualizado com sucesso!", user: data?.[0] });
  });
  app.post("/login", async (request, reply) => {
    const { cpf, password } = request.body;
    const { data: user, error } = await supabase.from("users").select("cpf, password, name, email, status").eq("cpf", cpf).single();
    if (error || !user) return reply.status(404).send({ error: "CPF n\xE3o encontrado." });
    const match = await comparePassword(password, user.password);
    if (!match) return reply.status(401).send({ error: "Senha incorreta." });
    const token = generateToken({ cpf: user.cpf, name: user.name, email: user.email, status: user.status });
    return reply.send({ message: "Login bem-sucedido!", token, user });
  });
  app.post("/reset-password", async (request, reply) => {
    const { email, newPassword } = request.body;
    const hashedPassword = await hashPassword(newPassword);
    const { error } = await supabase.from("users").update({ password: hashedPassword }).eq("email", email);
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ message: "Senha redefinida com sucesso!" });
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  registerUserRoutes
});
