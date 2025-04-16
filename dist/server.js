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
var import_cors = __toESM(require("@fastify/cors"));
var import_multipart = __toESM(require("@fastify/multipart"));

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
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var app = (0, import_fastify.default)({
  logger: true
});
app.register(import_multipart.default);
app.register(import_cors.default, {
  origin: "*",
  // Permite todas as origens, ou defina o domínio específico
  methods: ["GET", "POST", "PUT", "DELETE"],
  // Métodos permitidos
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});
var SECRET_KEY = "seu_segredo_super_seguro";
var hashPassword = async (password) => {
  return await import_bcryptjs.default.hash(password, 10);
};
var comparePassword = async (password, hashedPassword) => {
  return await import_bcryptjs.default.compare(password, hashedPassword);
};
app.get("/", async (request, reply) => {
  return reply.send({ message: "\u{1F680} API Fastify rodando com sucesso!" });
});
app.get("/users", async (request, reply) => {
  try {
    const { data: users, error } = await supabase.from("users").select("*");
    if (error) throw new Error(error.message);
    return reply.send({ users });
  } catch (error) {
    console.error("Erro ao buscar usu\xE1rios:", error);
    return reply.status(500).send({ error: "Erro ao buscar usu\xE1rios." });
  }
});
app.post("/users", async (request, reply) => {
  try {
    const { name, email, password, registro, cpf, celular } = request.body;
    if (!name || !email || !password || !registro || !cpf || !celular) {
      return reply.status(400).send({ error: "Todos os campos s\xE3o obrigat\xF3rios." });
    }
    const hashedPassword = await hashPassword(password);
    const status = "1";
    const { data: createdUser, error } = await supabase.from("users").insert([{ name, email, password: hashedPassword, registro, cpf, celular, status }]).select();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(201).send({ users: createdUser ? createdUser[0] : null });
  } catch (error) {
    console.error("Erro ao criar usu\xE1rio:", error);
    return reply.status(500).send({ error: "Erro ao criar usu\xE1rio." });
  }
});
app.put("/users/:cpf", async (request, reply) => {
  try {
    const { cpf } = request.params;
    const { name, email, password, registro, celular, status } = request.body;
    if (!cpf) return reply.status(400).send({ error: "CPF \xE9 obrigat\xF3rio." });
    let hashedPassword;
    if (password) {
      hashedPassword = await hashPassword(password);
    }
    const updateData = {
      ...name && { name },
      ...email && { email },
      ...hashedPassword && { password: hashedPassword },
      ...registro && { registro },
      ...celular && { celular },
      ...status && { status }
    };
    const { data: updatedUser, error } = await supabase.from("users").update(updateData).eq("cpf", cpf).select();
    if (error) return reply.status(400).send({ error: error.message });
    if (!updatedUser || updatedUser.length === 0) {
      return reply.status(404).send({ error: "Usu\xE1rio n\xE3o encontrado." });
    }
    return reply.send({ message: "Usu\xE1rio atualizado com sucesso!", user: updatedUser[0] });
  } catch (error) {
    console.error("Erro ao atualizar usu\xE1rio:", error);
    return reply.status(500).send({ error: "Erro ao atualizar usu\xE1rio." });
  }
});
app.post("/login", async (request, reply) => {
  try {
    const { cpf, password } = request.body;
    if (!cpf || !password) {
      return reply.status(400).send({ error: "CPF e senha s\xE3o obrigat\xF3rios." });
    }
    const { data: user, error: userError } = await supabase.from("users").select("cpf, password, name, email, status").eq("cpf", cpf).single();
    if (userError || !user) {
      return reply.status(404).send({ error: "CPF n\xE3o encontrado." });
    }
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return reply.status(401).send({ error: "Senha incorreta." });
    }
    const token = import_jsonwebtoken.default.sign(
      { cpf: user.cpf, name: user.name, email: user.email, status: user.status },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    return reply.send({ message: "Login bem-sucedido!", token, user });
  } catch (error) {
    console.error("Erro no login:", error);
    return reply.status(500).send({ error: "Erro ao fazer login." });
  }
});
app.post("/reset-password", async (request, reply) => {
  try {
    const { email, newPassword } = request.body;
    if (!email || !newPassword) {
      return reply.status(400).send({ error: "E-mail e nova senha s\xE3o obrigat\xF3rios." });
    }
    const { data: user, error: userError } = await supabase.from("users").select("email").eq("email", email).single();
    if (userError || !user) {
      return reply.status(404).send({ error: "Usu\xE1rio n\xE3o encontrado." });
    }
    const hashedPassword = await hashPassword(newPassword);
    const { error } = await supabase.from("users").update({ password: hashedPassword }).eq("email", email);
    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return reply.status(500).send({ error: "Erro ao redefinir senha." });
  }
});
app.get("/patients", async (request, reply) => {
  try {
    const { data: patients, error } = await supabase.from("patients").select("*");
    if (error) throw new Error(error.message);
    return reply.send({ patients });
  } catch (error) {
    console.error("Erro ao buscar paciente:", error);
    return reply.status(500).send({ error: "Erro ao buscar paciente." });
  }
});
app.post("/patients", async (request, reply) => {
  try {
    const { name, cpf, location, phone, region, specialty, date, time } = request.body;
    if (!name || !cpf || !location || !phone || !region || !specialty || !date || !time) {
      return reply.status(400).send({ error: "Todos os campos s\xE3o obrigat\xF3rios." });
    }
    const { data: existingPatient, error: checkError } = await supabase.from("patients").select("id").eq("cpf", cpf).single();
    if (checkError === null && existingPatient) {
      return reply.status(409).send({ error: "CPF j\xE1 cadastrado." });
    }
    const { data: createdPatient, error } = await supabase.from("patients").insert([{ name, cpf, location, phone, region, specialty, date, time }]).select();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(201).send({ patients: createdPatient ? createdPatient[0] : null });
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return reply.status(500).send({ error: "Erro ao criar paciente." });
  }
});
app.put("/patients/:id", async (request, reply) => {
  try {
    const { id } = request.params;
    const { name, cpf, location, phone, region, specialty, date, time } = request.body;
    if (!name || !cpf || !location || !phone || !region || !specialty || !date || !time) {
      return reply.status(400).send({ error: "Todos os campos s\xE3o obrigat\xF3rios para atualiza\xE7\xE3o." });
    }
    const { data: updatedPatient, error } = await supabase.from("patients").update({ name, cpf, location, phone, region, specialty, date, time }).eq("id", id).select();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ patients: updatedPatient ? updatedPatient[0] : null });
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return reply.status(500).send({ error: "Erro ao atualizar paciente." });
  }
});
app.delete("/patients/:id", async (request, reply) => {
  try {
    const { id } = request.params;
    if (!id) {
      return reply.status(400).send({ error: "ID do paciente \xE9 obrigat\xF3rio." });
    }
    const patientId = Number(id);
    if (isNaN(patientId)) {
      return reply.status(400).send({ error: "ID inv\xE1lido." });
    }
    const { data: deletedPatient, error } = await supabase.from("patients").delete().eq("id", patientId).select();
    if (error) {
      return reply.status(400).send({ error: error.message });
    }
    if (!deletedPatient || deletedPatient.length === 0) {
      return reply.status(404).send({ error: "Paciente n\xE3o encontrado." });
    }
    return reply.send({ message: "Paciente exclu\xEDdo com sucesso!", patient: deletedPatient[0] });
  } catch (error) {
    console.error("Erro ao excluir paciente:", error);
    return reply.status(500).send({ error: "Erro ao excluir paciente." });
  }
});
app.get("/jobs", async (request, reply) => {
  try {
    const { data: jobs, error } = await supabase.from("jobs").select("*");
    if (error) throw new Error(error.message);
    return reply.send({ jobs });
  } catch (error) {
    console.error("Erro ao buscar vagas:", error);
    return reply.status(500).send({ error: "Erro ao buscar vagas." });
  }
});
app.get("/jobs/:id", async (request, reply) => {
  const { id } = request.params;
  const numericId = Number(id);
  if (isNaN(numericId)) {
    return reply.status(400).send({ error: "ID inv\xE1lido." });
  }
  try {
    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", numericId).single();
    if (error) {
      return reply.status(404).send({ error: "Vaga n\xE3o encontrada." });
    }
    return reply.send({ job });
  } catch (error) {
    console.error("Erro ao buscar vaga por ID:", error);
    return reply.status(500).send({ error: "Erro ao buscar vaga." });
  }
});
app.post("/jobs", async (request, reply) => {
  try {
    const {
      cargo,
      salario,
      local,
      descricao,
      requisitos,
      beneficios,
      horario,
      regime_contratacao
    } = request.body;
    if (!cargo || !salario || !local || !descricao || !requisitos || !beneficios || !horario || !regime_contratacao) {
      return reply.status(400).send({ error: "Todos os campos s\xE3o obrigat\xF3rios." });
    }
    const { data: createdJob, error } = await supabase.from("jobs").insert([{
      cargo,
      salario,
      local,
      descricao,
      requisitos,
      beneficios,
      horario,
      regime_contratacao
    }]).select();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(201).send({ job: createdJob ? createdJob[0] : null });
  } catch (error) {
    console.error("Erro ao criar vaga:", error);
    return reply.status(500).send({ error: "Erro ao criar vaga." });
  }
});
app.put("/jobs/:id", async (request, reply) => {
  try {
    const { id } = request.params;
    const {
      cargo,
      salario,
      local,
      descricao,
      requisitos,
      beneficios,
      horario,
      regime_contratacao
    } = request.body;
    if (!cargo || !salario || !local || !descricao || !requisitos || !beneficios || !horario || !regime_contratacao) {
      return reply.status(400).send({ error: "Todos os campos s\xE3o obrigat\xF3rios para atualiza\xE7\xE3o." });
    }
    const { data: updatedJob, error } = await supabase.from("jobs").update({
      cargo,
      salario,
      local,
      descricao,
      requisitos,
      beneficios,
      horario,
      regime_contratacao
    }).eq("id", id).select();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ job: updatedJob ? updatedJob[0] : null });
  } catch (error) {
    console.error("Erro ao atualizar vaga:", error);
    return reply.status(500).send({ error: "Erro ao atualizar vaga." });
  }
});
app.delete("/jobs/:id", async (request, reply) => {
  try {
    const { id } = request.params;
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return reply.status(400).send({ error: "ID inv\xE1lido." });
    }
    const { data: deletedJob, error } = await supabase.from("jobs").delete().eq("id", numericId).select();
    if (error) return reply.status(400).send({ error: error.message });
    if (!deletedJob || deletedJob.length === 0) {
      return reply.status(404).send({ error: "Vaga n\xE3o encontrada." });
    }
    return reply.send({ message: "Vaga exclu\xEDda com sucesso!", job: deletedJob[0] });
  } catch (error) {
    console.error("Erro ao excluir vaga:", error);
    return reply.status(500).send({ error: "Erro ao excluir vaga." });
  }
});
app.get("/job-applications", async (request, reply) => {
  try {
    const { data: applications, error: appError } = await supabase.from("jobApplications").select("*");
    if (appError) {
      console.error("Erro ao buscar candidaturas:", appError);
      throw new Error(appError.message);
    }
    if (!applications || applications.length === 0) {
      console.error("Nenhuma candidatura encontrada.");
      return reply.status(404).send({ error: "Nenhuma candidatura encontrada." });
    }
    const jobIds = applications.map((app2) => app2.job_id);
    const { data: jobs, error: jobError } = await supabase.from("jobs").select("*").in("id", jobIds);
    if (jobError) {
      console.error("Erro ao buscar jobs:", jobError);
      throw new Error(jobError.message);
    }
    if (!Array.isArray(jobs)) {
      console.error("Erro: jobs n\xE3o \xE9 um array v\xE1lido.");
      return reply.status(500).send({ error: "Erro ao buscar os jobs." });
    }
    const result = applications.map((app2) => {
      const job = jobs.find((job2) => job2.id === app2.job_id);
      if (!job) {
        console.error(`Job n\xE3o encontrado para o job_id ${app2.job_id}`);
        return { ...app2, job: null };
      }
      return { ...app2, job };
    });
    return reply.send({ applications: result });
  } catch (error) {
    console.error("Erro ao buscar candidaturas:", error);
    return reply.status(500).send({ error: "Erro ao buscar candidaturas." });
  }
});
app.post("/job-applications", async (request, reply) => {
  try {
    const { job_id, name, email, phone } = request.body;
    if (!job_id || !name || !email || !phone) {
      return reply.status(400).send({ error: "Todos os campos obrigat\xF3rios devem ser preenchidos." });
    }
    const { data: application, error } = await supabase.from("jobApplications").insert([{ job_id, name, email, phone }]).select();
    if (error) {
      return reply.status(500).send({ error: "Erro ao cadastrar candidatura." });
    }
    return reply.status(201).send({ application: application[0] });
  } catch (error) {
    console.error("Erro ao processar a candidatura:", error);
    return reply.status(500).send({ error: "Erro ao processar a candidatura." });
  }
});
app.delete("/job-applications/:id", async (request, reply) => {
  const { id } = request.params;
  try {
    const { data, error } = await supabase.from("jobApplications").delete().eq("id", id);
    if (error) {
      return reply.status(500).send({ error: "Erro ao excluir a candidatura." });
    }
    if (!data || data.length === 0) {
      return reply.status(404).send({ error: "Candidatura n\xE3o encontrada." });
    }
    return reply.status(200).send({ message: "Candidatura exclu\xEDda com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir candidatura:", error);
    return reply.status(500).send({ error: "Erro ao excluir candidatura." });
  }
});
app.listen({
  host: "0.0.0.0",
  port: process.env.PORT ? Number(process.env.PORT) : 3333
}).then(() => {
  console.log("\u2705 Servidor Funcionando!");
}).catch((err) => {
  console.error("\u274C Erro ao iniciar servidor:", err);
  process.exit(1);
});
