import { NextRequest } from "next/server";
import {
  createContextFromRequest,
  createTrcpClientFromCtx,
} from "@/server/api/client";
import { TRPCError } from "@trpc/server";
import { z, ZodError } from "zod";

import { Context } from "@hoarder/trpc";

function trpcCodeToHttpCode(code: TRPCError["code"]) {
  switch (code) {
    case "BAD_REQUEST":
    case "PARSE_ERROR":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "METHOD_NOT_SUPPORTED":
      return 405;
    case "TIMEOUT":
      return 408;
    case "PAYLOAD_TOO_LARGE":
      return 413;
    case "INTERNAL_SERVER_ERROR":
      return 500;
    default:
      return 500;
  }
}

interface ErrorMessage {
  path: (string | number)[];
  message: string;
}

function formatZodError(error: ZodError): string {
  if (!error.issues) {
    return error.message || "An unknown error occurred";
  }

  const errors: ErrorMessage[] = error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }));

  const formattedErrors = errors.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });

  return `${formattedErrors.join(", ")}`;
}

export interface TrpcAPIRequest<SearchParamsT, BodyType> {
  ctx: Context;
  api: ReturnType<typeof createTrcpClientFromCtx>;
  searchParams: SearchParamsT extends z.ZodTypeAny
    ? z.infer<SearchParamsT>
    : undefined;
  body: BodyType extends z.ZodTypeAny
    ? z.infer<BodyType> | undefined
    : undefined;
}

type SchemaType<T> = T extends z.ZodTypeAny
  ? z.infer<T> | undefined
  : undefined;

export async function buildHandler<
  SearchParamsT extends z.ZodTypeAny | undefined,
  BodyT extends z.ZodTypeAny | undefined,
  InputT extends TrpcAPIRequest<SearchParamsT, BodyT>,
>({
  req,
  handler,
  searchParamsSchema,
  bodySchema,
}: {
  req: NextRequest;
  handler: (req: InputT) => Promise<{ status: number; resp?: object }>;
  searchParamsSchema?: SearchParamsT | undefined;
  bodySchema?: BodyT | undefined;
}) {
  try {
    const ctx = await createContextFromRequest(req);
    const api = createTrcpClientFromCtx(ctx);

    let searchParams: SchemaType<SearchParamsT> | undefined = undefined;
    if (searchParamsSchema !== undefined) {
      searchParams = searchParamsSchema.parse(
        Object.fromEntries(req.nextUrl.searchParams.entries()),
      ) as SchemaType<SearchParamsT>;
    }

    let body: SchemaType<BodyT> | undefined = undefined;
    if (bodySchema) {
      if (req.headers.get("Content-Type") !== "application/json") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Content-Type must be application/json",
        });
      }

      let bodyJson = undefined;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        bodyJson = await req.json();
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid JSON: ${(e as Error).message}`,
        });
      }
      body = bodySchema.parse(bodyJson) as SchemaType<BodyT>;
    }

    const { status, resp } = await handler({
      ctx,
      api,
      searchParams,
      body,
    } as InputT);

    return new Response(resp ? JSON.stringify(resp) : null, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return new Response(
        JSON.stringify({ code: "ParseError", message: formatZodError(e) }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
    if (e instanceof TRPCError) {
      let message = e.message;
      if (e.cause instanceof ZodError) {
        message = formatZodError(e.cause);
      }
      return new Response(JSON.stringify({ code: e.code, error: message }), {
        status: trpcCodeToHttpCode(e.code),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      const error = e as Error;
      console.error(
        `Unexpected error in: ${req.method} ${req.nextUrl.pathname}:\n${error.stack}`,
      );
      return new Response(JSON.stringify({ code: "UnknownError" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }
}
