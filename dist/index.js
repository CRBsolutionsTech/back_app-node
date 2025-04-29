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

// src/index.ts
var import_fastify = __toESM(require("fastify"));
var import_cors = __toESM(require("@fastify/cors"));

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
async function registerUserRoutes(app2) {
  app2.get("/users", async (_, reply) => {
    const { data, error } = await supabase.from("users").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ users: data });
  });
  app2.post("/users", async (request, reply) => {
    const { name, email, password, registro, cpf, celular } = request.body;
    if (!name || !email || !password || !registro || !cpf || !celular) {
      return reply.status(400).send({ error: "Todos os campos s\xE3o obrigat\xF3rios." });
    }
    const hashedPassword = await hashPassword(password);
    const status = "1";
    const { data, error } = await supabase.from("users").insert([{ name, email, password: hashedPassword, registro, cpf, celular, status }]).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.status(201).send({ users: data?.[0] });
  });
  app2.put("/users/:cpf", async (request, reply) => {
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
  app2.post("/login", async (request, reply) => {
    const { cpf, password } = request.body;
    const { data: user, error } = await supabase.from("users").select("cpf, password, name, email, status").eq("cpf", cpf).single();
    if (error || !user) return reply.status(404).send({ error: "CPF n\xE3o encontrado." });
    const match = await comparePassword(password, user.password);
    if (!match) return reply.status(401).send({ error: "Senha incorreta." });
    const token = generateToken({ cpf: user.cpf, name: user.name, email: user.email, status: user.status });
    return reply.send({ message: "Login bem-sucedido!", token, user });
  });
  app2.post("/reset-password", async (request, reply) => {
    const { email, newPassword } = request.body;
    const hashedPassword = await hashPassword(newPassword);
    const { error } = await supabase.from("users").update({ password: hashedPassword }).eq("email", email);
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ message: "Senha redefinida com sucesso!" });
  });
}

// src/routes/patientsRoutes.ts
async function registerPatientRoutes(app2) {
  app2.get("/patients", async (_, reply) => {
    const { data, error } = await supabase.from("patients").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ patients: data });
  });
  app2.post("/patients", async (request, reply) => {
    const patient = request.body;
    const requiredFields = ["name", "cpf", "location", "phone", "region", "specialty", "date", "time"];
    if (requiredFields.some((field) => !patient[field])) {
      return reply.status(400).send({ error: "Todos os campos s\xE3o obrigat\xF3rios." });
    }
    const { data: exists } = await supabase.from("patients").select("id").eq("cpf", patient.cpf).single();
    if (exists) return reply.status(409).send({ error: "CPF j\xE1 cadastrado." });
    const { data, error } = await supabase.from("patients").insert([patient]).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.status(201).send({ patients: data?.[0] });
  });
  app2.put("/patients/:id", async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;
    const { data, error } = await supabase.from("patients").update(updates).eq("id", id).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ patients: data?.[0] });
  });
  app2.delete("/patients/:id", async (request, reply) => {
    const { id } = request.params;
    const { data, error } = await supabase.from("patients").delete().eq("id", Number(id)).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ message: "Paciente exclu\xEDdo!", patient: data?.[0] });
  });
}

// src/routes/jobsRoutes.ts
async function registerJobRoutes(app2) {
  app2.get("/jobs", async (_, reply) => {
    const { data, error } = await supabase.from("jobs").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ jobs: data });
  });
  app2.post("/jobs", async (request, reply) => {
    const job = request.body;
    const required = ["cargo", "salario", "local", "descricao", "requisitos", "beneficios", "horario", "regime_contratacao"];
    if (required.some((r) => !job[r])) return reply.status(400).send({ error: "Todos os campos s\xE3o obrigat\xF3rios." });
    const { data, error } = await supabase.from("jobs").insert([job]).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.status(201).send({ job: data?.[0] });
  });
  app2.put("/jobs/:id", async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;
    const { data, error } = await supabase.from("jobs").update(updates).eq("id", id).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ job: data?.[0] });
  });
  app2.delete("/jobs/:id", async (request, reply) => {
    const { id } = request.params;
    const { data, error } = await supabase.from("jobs").delete().eq("id", Number(id)).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ message: "Vaga exclu\xEDda!", job: data?.[0] });
  });
}

// src/routes/jobApplicationsRoutes.ts
async function registerJobApplicationRoutes(app2) {
  app2.get("/job-applications", async (_, reply) => {
    const { data, error } = await supabase.from("job_applications").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ applications: data });
  });
  app2.post("/job-applications", async (request, reply) => {
    const { job_id, name, email, phone, resume_url } = request.body;
    if (!job_id || !name || !email || !phone) {
      return reply.status(400).send({ error: "Todos os campos obrigat\xF3rios devem ser preenchidos." });
    }
    const { data, error } = await supabase.from("job_applications").insert([{ job_id, name, email, phone, resume_url }]).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.status(201).send({ application: data?.[0] });
  });
}

// src/index.ts
var app = (0, import_fastify.default)({ logger: true });
app.register(import_cors.default, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});
app.get("/", async (_, reply) => {
  return reply.send({ message: "\u{1F680} API Fastify rodando com sucesso!" });
});
registerUserRoutes(app);
registerPatientRoutes(app);
registerJobRoutes(app);
registerJobApplicationRoutes(app);
app.listen({ host: "0.0.0.0", port: Number(process.env.PORT) || 3333 }).then(() => console.log("\u2705 Servidor Funcionando!")).catch((err) => {
  console.error("\u274C Erro ao iniciar servidor:", err);
  process.exit(1);
});
