import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromRequest(request: Request): string | null {
  try {
    const token = request.headers
      .get("cookie")
      ?.split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function GET(
    request: Request,
    context: { params: { id: string } }
  ) {
    try {
      const { id } = context.params;
      const userId = getUserIdFromRequest(request);
  
      if (!userId) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
  
      // Fetch the template and verify it belongs to the user
      const template = await prisma.template.findFirst({
        where: {
          id,
          creatorId: userId,
        },
      });
  
      if (!template) {
        return new NextResponse(
          JSON.stringify({ error: 'Template not found or unauthorized' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
  
      return new NextResponse(
        JSON.stringify(template),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error fetching template:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch template' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify that the template belongs to the user
    const template = await prisma.template.findFirst({
      where: {
        id,
        creatorId: userId,
      },
    });

    if (!template) {
      return new NextResponse(
        JSON.stringify({ error: 'Template not found or unauthorized' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Unlink the certificates from the template
    await prisma.certificate.updateMany({
      where: {
        templateId: id,
      },
      data: {
        templateId: undefined,
      },
    });

    // Delete the template
    await prisma.template.delete({
      where: {
        id,
      },
    });

    return new NextResponse(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting template:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to delete template' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
  
    const templateId = params.id;
    const body = await request.json();
  
    if (!body.name || !body.imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: 'name' and 'imageUrl'" }),
        { status: 400 }
      );
    }
  
    try {
      const template = await prisma.template.update({
        where: { id: templateId, creatorId: userId },
        data: {
          name: body.name,
          imageUrl: body.imageUrl,
          placeholders: body.placeholders || [],
          signatures: body.signatures || [],
        },
      });
  
      return new Response(JSON.stringify(template), { status: 200 });
    } catch (error) {
      console.error("Error updating template:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update template" }),
        { status: 500 }
      );
    }
  }
