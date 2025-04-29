import { FastifyInstance } from "fastify";
import { supabase } from "../supabaseConnection";

export async function registerJobApplicationRoutes(app: FastifyInstance) {
  app.get("/job-applications", async (_, reply) => {
    const { data, error } = await supabase.from("job_applications").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ applications: data });
  });

  app.post("/job-applications", async (request, reply) => {
    const { job_id, name, email, phone, resume_url } = request.body as any;
    if (!job_id || !name || !email || !phone) {
      return reply.status(400).send({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }
    const { data, error } = await supabase
      .from("job_applications").insert([{ job_id, name, email, phone, resume_url }]).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.status(201).send({ application: data?.[0] });
  });
}
