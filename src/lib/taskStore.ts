export interface TaskRecord {
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: number;
}

// Global Memory Store for Edge Task Polling across route handlers
const taskMemoryMap = new Map<string, TaskRecord>();

export const taskStore = {
  get(id: string): TaskRecord | undefined {
    return taskMemoryMap.get(id);
  },
  set(id: string, record: TaskRecord): void {
    taskMemoryMap.set(id, record);
  },
  delete(id: string): void {
    taskMemoryMap.delete(id);
  },
};
