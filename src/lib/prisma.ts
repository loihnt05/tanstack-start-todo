import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "../../app/generated/prisma/client";

const prisma = new PrismaClient().$extends(withAccelerate());

export default prisma;