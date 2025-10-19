import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";

import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import prisma from "@/lib/prisma";
import { TodoList, todo } from "./todo-list";

export const Route = createFileRoute("/todo/home")({
  component: RouteComponent,
  loader: async () => {
    const todos = await getTodosServerFn();
    return { todos };
  },
});

function RouteComponent() {
  const { todos } = Route.useLoaderData();
  const [listTodo, setListTodo] = React.useState(todos);
  const deleteTodo = useServerFn(deleteTodoServerFn);
  
  const handleDeleteTodo = async (id: string) => {
    await deleteTodo({ data: { id } });
    setListTodo((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
    toast.success("Todo deleted successfully!");
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-96 flex-shrink-0">
            <TodoForm setListTodo={setListTodo} />
          </div>
          <div className="flex-1">
            <TodoList data={listTodo} onDelete={handleDeleteTodo} />
          </div>
        </div>
      </div>
    </div>
  );
}

const formSchema = z.object({
  title: z
    .string()
    .min(5, "Bug title must be at least 5 characters.")
    .max(32, "Bug title must be at most 32 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(100, "Description must be at most 100 characters."),
});
const getTodosServerFn = createServerFn({ method: "GET" }).handler(async () => {
  return await prisma.todo.findMany();
});

const createTodoServerFn = createServerFn({ method: "POST" })
  .inputValidator(formSchema)
  .handler(async (request) => {
    const { title, description } = request.data;
    
    return await prisma.todo.create({
      data: {
        title,
        description,
        completed: false,
      },
    });
  });

const deleteTodoServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async (request) => {
    const { id } = request.data;
    return await prisma.todo.delete({
      where: { id },
    });
  });

export function TodoForm({ setListTodo }: { setListTodo: React.Dispatch<React.SetStateAction<todo[]>> }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });
  const submitTodo = useServerFn(createTodoServerFn);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const newTodo = await submitTodo({ data });
    
    // Update the todo list with the new todo
    setListTodo((prevTodos) => [...prevTodos, newTodo]);
    
    // Reset the form
    form.reset();
    
    toast.success("Todo created successfully!", {
      description: (
        <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
      position: "bottom-right",
      classNames: {
        content: "flex flex-col gap-2",
      },
      style: {
        "--border-radius": "calc(var(--radius)  + 4px)",
      } as React.CSSProperties,
    });
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>TODO Form</CardHeader>
      <CardContent>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">
                    Todo Title
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="text"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-description">
                    Description
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id="form-rhf-demo-description"
                      placeholder="description."
                      rows={6}
                      className="min-h-24 resize-none"
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon align="block-end">
                      <InputGroupText className="tabular-nums">
                        {field.value.length}/100 characters
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>
                    Include steps to reproduce, expected behavior, and what
                    actually happened.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <Field orientation="horizontal">
            <Button
              className="hover:cursor-pointer"
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button
              className="hover:cursor-pointer"
              type="submit"
              form="form-rhf-demo"
            >
              Submit
            </Button>
          </Field>
        </form>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}
