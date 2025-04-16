import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';  // Importando corretamente o fastifyMultipart
import { supabase } from './supabaseConnection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = fastify({
  logger: true,
});

app.register(fastifyMultipart);  // Registrando o plugin de multipart
app.register(cors, {
  origin: '*',  // Permite todas as origens, ou defina o domínio específico
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

const SECRET_KEY = "seu_segredo_super_seguro";

// Função para hash de senha
const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

// Função para comparar senha
const comparePassword = async (password: string, hashedPassword: string) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Rota principal
app.get("/", async (request, reply) => {
  return reply.send({ message: "🚀 API Fastify rodando com sucesso!" });
});

// GET - Usuários
app.get("/users", async (request, reply) => {
  try {
    const { data: users, error } = await supabase.from("users").select("*");
    if (error) throw new Error(error.message);

    return reply.send({ users });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return reply.status(500).send({ error: "Erro ao buscar usuários." });
  }
});

// POST - Criar usuário
app.post("/users", async (request, reply) => {
  try {
    const { name, email, password, registro, cpf, celular } = request.body as Users;

    if (!name || !email || !password || !registro || !cpf || !celular) {
      return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
    }

    const hashedPassword = await hashPassword(password);
    const status = "1"; // valor padrão

    const { data: createdUser, error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword, registro, cpf, celular, status }])
      .select();

    if (error) return reply.status(400).send({ error: error.message });

    return reply.status(201).send({ users: createdUser ? createdUser[0] : null });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return reply.status(500).send({ error: "Erro ao criar usuário." });
  }
});

// PUT - Atualizar usuário
app.put("/users/:cpf", async (request, reply) => {
  try {
    const { cpf } = request.params as { cpf: string };
    const { name, email, password, registro, celular, status } = request.body as Partial<Users>;

    if (!cpf) return reply.status(400).send({ error: "CPF é obrigatório." });

    let hashedPassword;
    if (password) {
      hashedPassword = await hashPassword(password);
    }

    const updateData: any = {
      ...(name && { name }),
      ...(email && { email }),
      ...(hashedPassword && { password: hashedPassword }),
      ...(registro && { registro }),
      ...(celular && { celular }),
      ...(status && { status })
    };

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("cpf", cpf)
      .select();

    if (error) return reply.status(400).send({ error: error.message });
    if (!updatedUser || updatedUser.length === 0) {
      return reply.status(404).send({ error: "Usuário não encontrado." });
    }

    return reply.send({ message: "Usuário atualizado com sucesso!", user: updatedUser[0] });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return reply.status(500).send({ error: "Erro ao atualizar usuário." });
  }
});

// POST - Login
app.post("/login", async (request, reply) => {
  try {
    const { cpf, password } = request.body as { cpf: string; password: string };

    if (!cpf || !password) {
      return reply.status(400).send({ error: "CPF e senha são obrigatórios." });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("cpf, password, name, email, status")
      .eq("cpf", cpf)
      .single();

    if (userError || !user) {
      return reply.status(404).send({ error: "CPF não encontrado." });
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return reply.status(401).send({ error: "Senha incorreta." });
    }

    const token = jwt.sign(
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

// POST - Resetar senha
app.post("/reset-password", async (request, reply) => {
  try {
    const { email, newPassword } = request.body as { email: string; newPassword: string };

    if (!email || !newPassword) {
      return reply.status(400).send({ error: "E-mail e nova senha são obrigatórios." });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return reply.status(404).send({ error: "Usuário não encontrado." });
    }

    const hashedPassword = await hashPassword(newPassword);

    const { error } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("email", email);

    if (error) return reply.status(400).send({ error: error.message });

    return reply.send({ message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return reply.status(500).send({ error: "Erro ao redefinir senha." });
  }
});

// GET - Buscar pacientes
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

// POST - Criar paciente
app.post("/patients", async (request, reply) => {
  try {
    const { name, cpf, location, phone, region, specialty, date, time } = request.body as Patients;

    if (!name || !cpf || !location || !phone || !region || !specialty || !date || !time) {
      return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
    }

    // Verificar se CPF já existe
    const { data: existingPatient, error: checkError } = await supabase
      .from("patients")
      .select("id")
      .eq("cpf", cpf)
      .single();

    if (checkError === null && existingPatient) {
      return reply.status(409).send({ error: "CPF já cadastrado." });
    }

    const { data: createdPatient, error } = await supabase
      .from("patients")
      .insert([{ name, cpf, location, phone, region, specialty, date, time }])
      .select();

    if (error) return reply.status(400).send({ error: error.message });

    return reply.status(201).send({ patients: createdPatient ? createdPatient[0] : null });
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return reply.status(500).send({ error: "Erro ao criar paciente." });
  }
});

// PUT - Atualizar paciente
app.put("/patients/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { name, cpf, location, phone, region, specialty, date, time } = request.body as Partial<Patients>;

    if (!name || !cpf || !location || !phone || !region || !specialty || !date || !time) {
      return reply.status(400).send({ error: "Todos os campos são obrigatórios para atualização." });
    }

    const { data: updatedPatient, error } = await supabase
      .from("patients")
      .update({ name, cpf, location, phone, region, specialty, date, time })
      .eq("id", id)
      .select();

    if (error) return reply.status(400).send({ error: error.message });

    return reply.send({ patients: updatedPatient ? updatedPatient[0] : null });
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return reply.status(500).send({ error: "Erro ao atualizar paciente." });
  }
});

// DELETE - Excluir paciente
app.delete("/patients/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    if (!id) {
      return reply.status(400).send({ error: "ID do paciente é obrigatório." });
    }

    const patientId = Number(id);
    if (isNaN(patientId)) {
      return reply.status(400).send({ error: "ID inválido." });
    }

    const { data: deletedPatient, error } = await supabase
      .from("patients")
      .delete()
      .eq("id", patientId)
      .select();

    if (error) {
      return reply.status(400).send({ error: error.message });
    }

    if (!deletedPatient || deletedPatient.length === 0) {
      return reply.status(404).send({ error: "Paciente não encontrado." });
    }

    return reply.send({ message: "Paciente excluído com sucesso!", patient: deletedPatient[0] });
  } catch (error) {
    console.error("Erro ao excluir paciente:", error);
    return reply.status(500).send({ error: "Erro ao excluir paciente." });
  }
});

// GET - Vagas de emprego
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

// GET - Buscar vaga específica por ID
app.get("/jobs/:id", async (request, reply) => {
  const { id } = request.params as { id: string };

  const numericId = Number(id);
  if (isNaN(numericId)) {
    return reply.status(400).send({ error: "ID inválido." });
  }

  try {
    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", numericId)
      .single();

    if (error) {
      return reply.status(404).send({ error: "Vaga não encontrada." });
    }

    return reply.send({ job });
  } catch (error) {
    console.error("Erro ao buscar vaga por ID:", error);
    return reply.status(500).send({ error: "Erro ao buscar vaga." });
  }
});


// POST - Criar vaga de emprego
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

    // Validação dos campos obrigatórios
    if (
      !cargo ||
      !salario ||
      !local ||
      !descricao ||
      !requisitos ||
      !beneficios ||
      !horario ||
      !regime_contratacao
    ) {
      return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
    }

    // Inserção da vaga no Supabase
    const { data: createdJob, error } = await supabase
      .from("jobs")
      .insert([{
        cargo,
        salario,
        local,
        descricao,
        requisitos,
        beneficios,
        horario,
        regime_contratacao
      }])
      .select();

    // Tratamento de erro
    if (error) return reply.status(400).send({ error: error.message });

    // Retorno da vaga criada
    return reply.status(201).send({ job: createdJob ? createdJob[0] : null });

  } catch (error) {
    console.error("Erro ao criar vaga:", error);
    return reply.status(500).send({ error: "Erro ao criar vaga." });
  }
});

// PUT - Editar vaga de emprego
app.put("/jobs/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
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

    // Validação
    if (
      !cargo ||
      !salario ||
      !local ||
      !descricao ||
      !requisitos ||
      !beneficios ||
      !horario ||
      !regime_contratacao
    ) {
      return reply.status(400).send({ error: "Todos os campos são obrigatórios para atualização." });
    }

    const { data: updatedJob, error } = await supabase
      .from("jobs")
      .update({
        cargo,
        salario,
        local,
        descricao,
        requisitos,
        beneficios,
        horario,
        regime_contratacao
      })
      .eq("id", id)
      .select();

    if (error) return reply.status(400).send({ error: error.message });

    return reply.send({ job: updatedJob ? updatedJob[0] : null });
  } catch (error) {
    console.error("Erro ao atualizar vaga:", error);
    return reply.status(500).send({ error: "Erro ao atualizar vaga." });
  }
});

// DELETE - Deletar vaga de emprego
app.delete("/jobs/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const numericId = Number(id);
    if (isNaN(numericId)) {
      return reply.status(400).send({ error: "ID inválido." });
    }

    const { data: deletedJob, error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", numericId)
      .select();

    if (error) return reply.status(400).send({ error: error.message });

    if (!deletedJob || deletedJob.length === 0) {
      return reply.status(404).send({ error: "Vaga não encontrada." });
    }

    return reply.send({ message: "Vaga excluída com sucesso!", job: deletedJob[0] });
  } catch (error) {
    console.error("Erro ao excluir vaga:", error);
    return reply.status(500).send({ error: "Erro ao excluir vaga." });
  }
});

// GET - Buscar candidaturas
app.get("/job-applications", async (request, reply) => {
  try {
    // Buscar candidaturas
    const { data: applications, error: appError } = await supabase
      .from("jobApplications")
      .select("*");

    if (appError) {
      console.error("Erro ao buscar candidaturas:", appError);
      throw new Error(appError.message);
    }

    // Verifique se há candidaturas retornadas
    if (!applications || applications.length === 0) {
      console.error("Nenhuma candidatura encontrada.");
      return reply.status(404).send({ error: "Nenhuma candidatura encontrada." });
    }

    // Obter os ids dos jobs relacionados
    const jobIds = applications.map(app => app.job_id);
    const { data: jobs, error: jobError } = await supabase
      .from("jobs")  // Corrigido para 'jobs' em vez de 'job'
      .select("*")
      .in("id", jobIds); // Obtém todos os jobs com base nos job_ids

    if (jobError) {
      console.error("Erro ao buscar jobs:", jobError);
      throw new Error(jobError.message);
    }

    // Verifique se `jobs` é um array válido
    if (!Array.isArray(jobs)) {
      console.error("Erro: jobs não é um array válido.");
      return reply.status(500).send({ error: "Erro ao buscar os jobs." });
    }

    // Juntar dados de candidaturas e jobs
    const result = applications.map(app => {
      const job = jobs.find(job => job.id === app.job_id);
      
      if (!job) {
        console.error(`Job não encontrado para o job_id ${app.job_id}`);
        return { ...app, job: null };  // Caso não encontre o job, insira 'null'
      }

      return { ...app, job };
    });

    return reply.send({ applications: result });
  } catch (error) {
    console.error("Erro ao buscar candidaturas:", error);
    return reply.status(500).send({ error: "Erro ao buscar candidaturas." });
  }
});


// POST - Criar candidaturas
app.post('/job-applications', async (request, reply) => {
  try {
    // Recebendo os dados do formulário
    const { job_id, name, email, phone } = request.body;

    // Verificando se todos os campos obrigatórios foram enviados
    if (!job_id || !name || !email || !phone) {
      return reply.status(400).send({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    // Inserindo os dados da candidatura no banco
    const { data: application, error } = await supabase
      .from('jobApplications')
      .insert([{ job_id, name, email, phone }])
      .select();

    // Se houver erro ao inserir no banco
    if (error) {
      return reply.status(500).send({ error: 'Erro ao cadastrar candidatura.' });
    }

    // Respondendo com os dados da candidatura criada
    return reply.status(201).send({ application: application[0] });
  } catch (error) {
    console.error('Erro ao processar a candidatura:', error);
    return reply.status(500).send({ error: 'Erro ao processar a candidatura.' });
  }
});

// Rota para excluir uma candidatura
app.delete('/job-applications/:id', async (request, reply) => {
  const { id } = request.params;

  try {
    // Tente excluir a candidatura com o ID fornecido
    const { data, error } = await supabase
      .from('jobApplications')
      .delete()
      .eq('id', id);

    if (error) {
      return reply.status(500).send({ error: 'Erro ao excluir a candidatura.' });
    }

    if (!data || data.length === 0) {
      return reply.status(404).send({ error: 'Candidatura não encontrada.' });
    }

    // Responder com sucesso
    return reply.status(200).send({ message: 'Candidatura excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir candidatura:', error);
    return reply.status(500).send({ error: 'Erro ao excluir candidatura.' });
  }
});





// Start do servidor
app
  .listen({
    host: "0.0.0.0",
    port: process.env.PORT ? Number(process.env.PORT) : 3333
  })
  .then(() => {
    console.log("✅ Servidor Funcionando!");
  })
  .catch((err) => {
    console.error("❌ Erro ao iniciar servidor:", err);
    process.exit(1);
  });
