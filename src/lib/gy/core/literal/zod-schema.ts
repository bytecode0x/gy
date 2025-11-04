import { z } from 'zod'
import { DataRecord, Matrix } from '../type/primitive'

export const matrixSchema: z.ZodSchema<Matrix> = z.array(z.array(z.string()))

export const dataRecordSchema: z.ZodSchema<DataRecord> = z.record(z.string(), z.array(z.array(z.string())))
