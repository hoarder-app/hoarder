export interface DequeuedJob<T> {
  id: string;
  data: T;
  runNumber: number;
}

export interface DequeuedJobError<T> {
  id: string;
  data?: T;
  error: Error;
}
