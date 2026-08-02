import { useQuery } from "@tanstack/react-query"
import { todoService } from "../services/todoService"
import type { TodoStatus } from "../types"

export function useTodos(status?: TodoStatus) {
  return useQuery({
    queryKey: ["todos", status],
    queryFn: () => todoService.getTodos(status ? { status } : undefined),
  })
}
