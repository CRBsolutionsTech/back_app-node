"use strict";

// src/routes/upload.js
var path = require("path");
var { createClient } = require("@supabase/supabase-js");
var crypto = require("crypto");
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
async function jobApplicationUploadRoute(fastify, options) {
  fastify.post("/job-applications/upload", async (req, reply) => {
    const parts = req.parts();
    let fields = {};
    let fileBuffer = null;
    let fileName = null;
    let fileExt = null;
    for await (const part of parts) {
      if (part.type === "file" && part.fieldname === "curriculo") {
        fileName = part.filename;
        fileExt = path.extname(fileName);
        fileBuffer = await part.toBuffer();
      } else if (part.type === "field") {
        fields[part.fieldname] = part.value;
      }
    }
    if (!fileBuffer) {
      return reply.code(400).send({ error: "Curr\xEDculo n\xE3o enviado" });
    }
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${fileExt}`;
    const uploadPath = `curriculos/${uniqueName}`;
    const { data, error: uploadError } = await supabase.storage.from("curriculos").upload(uploadPath, fileBuffer, {
      contentType: "application/octet-stream",
      upsert: false
    });
    if (uploadError) {
      console.error(uploadError);
      return reply.code(500).send({ error: "Erro ao salvar curr\xEDculo no Supabase" });
    }
    const { data: urlData } = supabase.storage.from("curriculos").getPublicUrl(uploadPath);
    const insertPayload = {
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      job_id: parseInt(fields.job_id),
      curriculo_url: urlData.publicUrl
    };
    const { error: dbError } = await supabase.from("job_applications").insert([insertPayload]);
    if (dbError) {
      console.error(dbError);
      return reply.code(500).send({ error: "Erro ao salvar candidatura no banco" });
    }
    reply.send({ message: "Candidatura enviada com sucesso!" });
  });
}
module.exports = jobApplicationUploadRoute;
