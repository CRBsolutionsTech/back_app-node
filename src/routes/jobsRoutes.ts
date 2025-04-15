import { FastifyInstance } from "fastify";
import { supabase } from "../supabaseConnection";

export async function registerJobRoutes(app: FastifyInstance) {
  app.get("/jobs", async (_, reply) => {
    const { data, error } = await supabase.from("jobs").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ jobs: data });
  });

  app.post("/jobs", async (request, reply) => {
    const job = request.body as any;
    const required = ["cargo", "salario", "local", "descricao", "requisitos", "beneficios", "horario", "regime_contratacao"];
    if (required.some(r => !job[r])) return reply.status(400).send({ error: "Todos os campos são obrigatórios." });

    const { data, error } = await supabase.from("jobs").insert([job]).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.status(201).send({ job: data?.[0] });
  });

  app.put("/jobs/:id", async (request, reply) => {
    const { id } = request.params as any;
    const updates = request.body as any;
    const { data, error } = await supabase.from("jobs").update(updates).eq("id", id).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ job: data?.[0] });
  });

  app.delete("/jobs/:id", async (request, reply) => {
    const { id } = request.params as any;
    const { data, error } = await supabase.from("jobs").delete().eq("id", Number(id)).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ message: "Vaga excluída!", job: data?.[0] });
  });
}