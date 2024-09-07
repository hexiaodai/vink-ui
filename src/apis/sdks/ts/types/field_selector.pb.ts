/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

export enum FieldSelectorOperator {
  AND = "AND",
  OR = "OR",
}

export enum ConditionOperator {
  EQUAL = "EQUAL",
  NOT_EQUAL = "NOT_EQUAL",
  FUZZY = "FUZZY",
}

export type FieldSelector = {
  conditions?: Condition[]
  operator?: FieldSelectorOperator
}

export type Condition = {
  fields?: string[]
  operator?: ConditionOperator
  value?: string
}