import fastify from "fastify";
import cors from "@fastify/cors"; // 🔁 Importando o plugin de CORS
import { supabase } from "./supabaseConnection";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = fastify();
const SECRET_KEY = "seu_segredo_super_seguro"; // 🔑 Defina uma chave segura

// 🔐 Habilitando CORS
app.register(cors, (instance) => {
    return (req, callback) => {
      const corsOptions = {
        origin: true, // permite qualquer origem (ideal pra dev)
        credentials: true
      };
      callback(null, corsOptions);
    };
  });

type Users = {
  name: string;
  email: string;
  password: string;
  registro: string;
  cpf: string;
  celular: string;
  status: string;
};

type Patients = {
  name: string;
  location: string;
  phone: string;
  region: string;
  specialty: string;
  date: string;
  time: string;
};

// ✅ Rota principal
app.get("/", async (request, reply) => {
  return reply.send({ message: "🚀 API Fastify rodando com sucesso!" });
});

// ✅ GET - Usuários
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

// ✅ POST - Criar usuário
app.post("/users", async (request, reply) => {
  try {
    const { name, email, password, registro, cpf, celular, status } = request.body as Users;

    if (!name || !email || !password || !registro || !cpf || !celular || !status) {
      return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

// ✅ PUT - Atualizar usuário
app.put("/users/:cpf", async (request, reply) => {
  try {
    const { cpf } = request.params as { cpf: string };
    const { name, email, password, registro, celular, status } = request.body as Partial<Users>;

    if (!cpf) return reply.status(400).send({ error: "CPF é obrigatório." });

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updateData: any = {
      ...(name && { name }),
      ...(email && { email }),
      ...(hashedPassword && { password: hashedPassword }),
      ...(registro && { registro }),
      ...(celular && { celular }),
      ...(status && { status }),
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

// ✅ POST - Login
app.post("/login", async (request, reply) => {
  try {
    const { cpf, password } = request.body as { cpf: string; password: string };

    if (!cpf || !password) {
      return reply.status(400).send({ error: "CPF e senha são obrigatórios." });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("cpf, password, name, email")
      .eq("cpf", cpf)
      .single();

    if (userError || !user) {
      return reply.status(404).send({ error: "CPF não encontrado." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return reply.status(401).send({ error: "Senha incorreta." });
    }

    const token = jwt.sign(
      { cpf: user.cpf, name: user.name, email: user.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return reply.send({ message: "Login bem-sucedido!", token });
  } catch (error) {
    console.error("Erro no login:", error);
    return reply.status(500).send({ error: "Erro ao fazer login." });
  }
});

// ✅ POST - Logout (opcional)
app.post("/logout", async (request, reply) => {
    // Não há nada pra destruir no backend, já que o JWT é stateless
    // Mas você pode apenas responder que o logout foi "bem-sucedido"
    return reply.send({ message: "Logout realizado com sucesso!" });
  });

// ✅ POST - Resetar senha
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);

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

// ✅ GET - Buscar pacientes
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

// ✅ POST - Criar paciente
app.post("/patients", async (request, reply) => {
  try {
    const { name, location, phone, region, specialty, date, time } = request.body as Patients;

    if (!name || !location || !phone || !region || !specialty || !date || !time) {
      return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
    }

    const { data: createdPatient, error } = await supabase
      .from("patients")
      .insert([{ name, location, phone, region, specialty, date, time }])
      .select();

    if (error) return reply.status(400).send({ error: error.message });

    return reply.status(201).send({ patients: createdPatient ? createdPatient[0] : null });
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return reply.status(500).send({ error: "Erro ao criar paciente." });
  }
});

// ✅ PUT - Atualizar paciente
app.put("/patients/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { name, location, phone, region, specialty, date, time } = request.body as Partial<Patients>;

    if (!name || !location || !phone || !region || !specialty || !date || !time) {
      return reply.status(400).send({ error: "Todos os campos são obrigatórios para atualização." });
    }

    const { data: updatedPatient, error } = await supabase
      .from("patients")
      .update({ name, location, phone, region, specialty, date, time })
      .eq("id", id)
      .select();

    if (error) return reply.status(400).send({ error: error.message });

    return reply.send({ patients: updatedPatient ? updatedPatient[0] : null });
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return reply.status(500).send({ error: "Erro ao atualizar paciente." });
  }
});

// ✅ Start do servidor
app.listen({
  host: "0.0.0.0",
  port: process.env.PORT ? Number(process.env.PORT) : 3333,
}).then(() => {
  console.log("✅ Servidor Funcionando!");
}).catch(err => {
  console.error("❌ Erro ao iniciar servidor:", err);
  process.exit(1);
});
