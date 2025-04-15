import { FastifyInstance } from "fastify";
import { supabase } from "../supabaseConnection";

export async function registerPatientRoutes(app: FastifyInstance) {
  app.get("/patients", async (_, reply) => {
    const { data, error } = await supabase.from("patients").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ patients: data });
  });

  app.post("/patients", async (request, reply) => {
    const patient = request.body as any;
    const requiredFields = ["name", "cpf", "location", "phone", "region", "specialty", "date", "time"];
    if (requiredFields.some(field => !patient[field])) {
      return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
    }
    const { data: exists } = await supabase.from("patients").select("id").eq("cpf", patient.cpf).single();
    if (exists) return reply.status(409).send({ error: "CPF já cadastrado." });
    const { data, error } = await supabase.from("patients").insert([patient]).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.status(201).send({ patients: data?.[0] });
  });

  app.put("/patients/:id", async (request, reply) => {
    const { id } = request.params as any;
    const updates = request.body as any;
    const { data, error } = await supabase.from("patients").update(updates).eq("id", id).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ patients: data?.[0] });
  });

  app.delete("/patients/:id", async (request, reply) => {
    const { id } = request.params as any;
    const { data, error } = await supabase.from("patients").delete().eq("id", Number(id)).select();
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ message: "Paciente excluído!", patient: data?.[0] });
  });
}
