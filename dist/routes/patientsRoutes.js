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

// src/routes/patientsRoutes.ts
var patientsRoutes_exports = {};
__export(patientsRoutes_exports, {
  registerPatientRoutes: () => registerPatientRoutes
});
module.exports = __toCommonJS(patientsRoutes_exports);

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

// src/routes/patientsRoutes.ts
async function registerPatientRoutes(app) {
  app.get("/patients", async (_, reply) => {
    const { data, error } = await supabase.from("patients").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ patients: data });
  });
  app.post("/patients", async (request, reply) => {
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
  app.put("/patients/:id", async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;
    const { data, error } = await supabase.from("patients").update(updates).eq("id", id).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ patients: data?.[0] });
  });
  app.delete("/patients/:id", async (request, reply) => {
    const { id } = request.params;
    const { data, error } = await supabase.from("patients").delete().eq("id", Number(id)).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ message: "Paciente exclu\xEDdo!", patient: data?.[0] });
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  registerPatientRoutes
});
