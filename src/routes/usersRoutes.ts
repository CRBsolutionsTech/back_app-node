import { FastifyInstance } from "fastify";
import { supabase } from "../supabaseConnection";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";

export async function registerUserRoutes(app: FastifyInstance) {
  app.get("/users", async (_, reply) => {
    const { data, error } = await supabase.from("users").select("*");
    return error ? reply.status(500).send({ error: error.message }) : reply.send({ users: data });
  });

  app.post("/users", async (request, reply) => {
    const { name, email, password, registro, cpf, celular } = request.body as any;
    if (!name || !email || !password || !registro || !cpf || !celular) {
      return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
    }
    const hashedPassword = await hashPassword(password);
    const status = "1";
    const { data, error } = await supabase.from("users")
      .insert([{ name, email, password: hashedPassword, registro, cpf, celular, status }])
      .select();
    return error ? reply.status(400).send({ error: error.message }) : reply.status(201).send({ users: data?.[0] });
  });

  app.put("/users/:cpf", async (request, reply) => {
    const { cpf } = request.params as any;
    const { name, email, password, registro, celular, status } = request.body as any;
    const updateData: any = {
      ...(name && { name }), ...(email && { email }),
      ...(password && { password: await hashPassword(password) }),
      ...(registro && { registro }), ...(celular && { celular }),
      ...(status && { status })
    };
    const { data, error } = await supabase.from("users").update(updateData).eq("cpf", cpf).select();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ message: "Usuário atualizado com sucesso!", user: data?.[0] });
  });

  app.post("/login", async (request, reply) => {
    const { cpf, password } = request.body as any;
    const { data: user, error } = await supabase.from("users")
      .select("cpf, password, name, email, status").eq("cpf", cpf).single();
    if (error || !user) return reply.status(404).send({ error: "CPF não encontrado." });

    const match = await comparePassword(password, user.password);
    if (!match) return reply.status(401).send({ error: "Senha incorreta." });

    const token = generateToken({ cpf: user.cpf, name: user.name, email: user.email, status: user.status });
    return reply.send({ message: "Login bem-sucedido!", token, user });
  });

  app.post("/reset-password", async (request, reply) => {
    const { email, newPassword } = request.body as any;
    const hashedPassword = await hashPassword(newPassword);
    const { error } = await supabase.from("users").update({ password: hashedPassword }).eq("email", email);
    return error ? reply.status(400).send({ error: error.message }) : reply.send({ message: "Senha redefinida com sucesso!" });
  });
}
