import { NextRequest, NextResponse } from 'next/server';
import { taskStore } from '@/lib/taskStore';

export const runtime = 'edge';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少任务 ID' }, { status: 400 });
    }

    const task = taskStore.get(id);

    if (!task) {
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
