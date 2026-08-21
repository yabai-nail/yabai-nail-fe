import { apiRequest, apiRoutes } from "../api";
import type { Branch } from "./types";

export const branchesService = {
  list: () =>
    apiRequest<Branch[]>({
      method: "GET",
      url: apiRoutes.catalog.branches,
    }),
};
