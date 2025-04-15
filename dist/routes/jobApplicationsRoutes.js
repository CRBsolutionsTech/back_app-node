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

// src/routes/jobApplicationsRoutes.ts
var jobApplicationsRoutes_exports = {};
__export(jobApplicationsRoutes_exports, {
  registerJobApplicationRoutes: () => registerJobApplicationRoutes
});
module.exports = __toCommonJS(jobApplicationsRoutes_exports);

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

// src/routes/jobApplicationsRoutes.ts
async function registerJobApplicationRoutes(app) {
  app.get("/job-applications", async (_, reply) => {
    const { data, error } = await supabase.from("job_applications").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ applications: data });
  });
  app.post("/job-applications", async (request, reply) => {
    const { job_id, name, email, phone, resume_url } = request.body;
    if (!job_id || !name || !email || !phone) {
      return reply.status(400).send({ error: "Todos os campos obrigat\xF3rios devem ser preenchidos." });
    }
    const { data, error } = await supabase.from("job_applications").insert([{ job_id, name, email, phone, resume_url }]).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.status(201).send({ application: data?.[0] });
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  registerJobApplicationRoutes
});
