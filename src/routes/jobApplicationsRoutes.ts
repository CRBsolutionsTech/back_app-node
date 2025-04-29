import { FastifyInstance } from "fastify";
import { supabase } from "../supabaseConnection"; // Supondo que você tenha esse arquivo de conexão

export async function registerJobApplicationRoutes(app: FastifyInstance) {
  
  // Rota para obter todas as candidaturas
  app.get("/job-applications", async (_, reply) => {
    const { data, error } = await supabase.from("job_applications").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ applications: data });
  });

  // Rota para enviar uma candidatura com o currículo
  app.post("/job-applications", async (request, reply) => {
    const { job_id, name, email, phone, resume_url } = request.body as any;
    
    if (!job_id || !name || !email || !phone) {
      return reply.status(400).send({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }
    
    const { data, error } = await supabase
      .from("job_applications")
      .insert([{ job_id, name, email, phone, resume_url }])
      .select();
    
    return error ? reply.status(400).send({ error: error.message }) : reply.status(201).send({ application: data?.[0] });
  });

  // Nova rota para fazer upload de um currículo
  app.post("/job-applications/upload", async (request, reply) => {
    // Recebe o arquivo e os dados da candidatura
    const parts = request.parts();
    let fileBuffer: Buffer | null = null;
    let filename = '';
    let mimetype = '';
    
    // Dados da candidatura
    const fields: Record<string, string> = {};

    // Processa o multipart/form-data
    for await (const part of parts) {
      if (part.type === "file") {
        filename = `${Date.now()}-${part.filename}`;
        mimetype = part.mimetype;
        fileBuffer = await part.toBuffer();
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    if (!fileBuffer || !filename) {
      return reply.status(400).send({ error: "O arquivo do currículo não foi enviado corretamente." });
    }

    // Faz o upload no Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("curriculos")
      .upload(filename, fileBuffer, { contentType: mimetype });

    if (uploadError) {
      console.error("Erro ao salvar arquivo no Supabase:", uploadError);
      return reply.status(500).send({ error: "Erro ao salvar arquivo no Supabase." });
    }

    // Gerar a URL do arquivo
    const resumeUrl = `https://fsazoshvbyzxghxuohdd.supabase.co/storage/v1/object/public/curriculos/${filename}`;

    // Salva a candidatura no banco de dados, incluindo a URL do currículo
    const { data, error } = await supabase
      .from("job_applications")
      .insert([
        {
          job_id: fields.job_id,
          name: fields.name,
          email: fields.email,
          phone: fields.phone,
          resume_url: resumeUrl,
        },
      ])
      .select();

    return error ? reply.status(500).send({ error: error.message }) : reply.status(201).send({ application: data?.[0] });
  });
}
