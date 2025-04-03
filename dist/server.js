"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/server.ts
var import_fastify = __toESM(require("fastify"));

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

// src/server.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
var app = (0, import_fastify.default)();
app.get("/users", async (request, reply) => {
  try {
    const { data: users, error } = await supabase.from("users").select("*");
    if (error) {
      throw new Error(error.message);
    }
    return reply.send({ value: users });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao buscar usu\xE1rios" });
  }
});
app.post("/users", async (request, reply) => {
  try {
    const { name, registro, cpf, celular, email, password } = request.body;
    const { data: createdUser, error } = await supabase.from("users").insert([{
      name,
      registro,
      cpf,
      celular,
      email,
      password
    }]).select();
    if (error) {
      return reply.status(400).send({ error: error.message });
    }
    return reply.status(201).send({ value: createdUser ? createdUser[0] : null });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao criar usu\xE1rio" });
  }
});
app.post("/update-password", async (request, reply) => {
  try {
    const { email, newPassword } = request.body;
    if (!email || !newPassword) {
      return reply.status(400).send({ error: "E-mail e nova senha s\xE3o obrigat\xF3rios." });
    }
    const hashedPassword = await import_bcryptjs.default.hash(newPassword, 8);
    const { error } = await supabase.from("users").update({ password: hashedPassword }).eq("email", email);
    if (error) {
      return reply.status(400).send({ error: error.message });
    }
    return reply.send({ message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao redefinir senha." });
  }
});
app.get("/register", async (request, reply) => {
  try {
    const { data: register, error } = await supabase.from("register").select("*");
    if (error) {
      throw new Error(error.message);
    }
    return reply.send({ value: register });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao buscar usu\xE1rios" });
  }
});
app.post("/register", async (request, reply) => {
  try {
    const { name, registro, cpf, celular, email, password } = request.body;
    const { data: createdRegister, error } = await supabase.from("register").insert([{
      name,
      registro,
      cpf,
      celular,
      email,
      password
    }]).select();
    if (error) {
      return reply.status(400).send({ error: error.message });
    }
    return reply.status(201).send({ value: createdRegister ? createdRegister[0] : null });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: "Erro ao registrar usu\xE1rio" });
  }
});
app.listen({
  host: "0.0.0.0",
  port: process.env.PORT ? Number(process.env.PORT) : 3333
}).then(() => {
  console.log("Servidor Funcionando");
}).catch((err) => {
  console.error("Erro ao iniciar servidor:", err);
  process.exit(1);
});
