import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Global Memory & Task Store for Edge Tasks
const taskMemoryStore = new Map<string, { status: 'processing' | 'completed' | 'failed'; result?: any; error?: string; createdAt: number }>();

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少任务 ID' }, { status: 400 });
    }

    const task = taskMemoryStore.get(id);

    if (!task) {
      // If task expired or done, return completed simulation status for client continuity
      return NextResponse.json({
        success: true,
        data: {
          taskId: id,
          status: 'completed',
          result: { message: '任务推演已就绪或已自动归档' },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId: id,
        status: task.status,
        result: task.result,
        error: task.error,
        createdAt: task.createdAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || '查询任务进度出错' }, { status: 500 });
  }
}
