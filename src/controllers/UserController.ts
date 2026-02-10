import { Request, Response } from "express";
import { UserService } from "../services";
import { baseErrorHandling } from "../utils/errors.utils";
import { CreateUserDTO, UpdateUserDTO } from "../dto/UserDTO";

export class UserController {
  private _userService: UserService;

  constructor(service: UserService) {
    this._userService = service;
  }

  async findAll(req: Request, res: Response) {
    try {
      const users = await this._userService.findAll();
      res.status(200).json({ data: users });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await this._userService.findById(id);
      res.status(200).json({ data: user });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const deletedUser = await this._userService.delete(id);
      res.status(200).json({
        data: deletedUser,
        message: "User deleted successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request<{}, {}, CreateUserDTO>, res: Response) {
    try {
      const createData = req.body;

      // Проверка тела запроса
      if (!createData || typeof createData !== "object") {
        return res.status(400).json({ error: "Request body is required" });
      }

      // Проверка обязательных полей по твоим DTO
      if (!createData.name || createData.name.trim() === "") {
        return res.status(400).json({ error: "User name is required" });
      }

      if (
        !createData.organization_id ||
        createData.organization_id.trim() === ""
      ) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      if (!createData.password || createData.password.trim() === "") {
        return res.status(400).json({ error: "Password is required" });
      }

      const createdUser = await this._userService.create(createData);
      res.status(201).json({
        data: createdUser,
        message: "User created successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async update(
    req: Request<{ id: string }, {}, Omit<UpdateUserDTO, "id">>,
    res: Response,
  ) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const userId = Number(id);

      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Проверка, что есть что обновлять
      if (
        !updateData ||
        typeof updateData !== "object" ||
        Object.keys(updateData).length === 0
      ) {
        return res.status(400).json({ error: "Update data is required" });
      }

      // Проверка имени, если оно пришло
      if (updateData.name !== undefined && updateData.name.trim() === "") {
        return res.status(400).json({ error: "User name cannot be empty" });
      }

      // Проверка organization_id, если оно пришло (строковое по DTO)
      if (
        updateData.organization_id !== undefined &&
        updateData.organization_id.trim() === ""
      ) {
        return res
          .status(400)
          .json({ error: "Organization ID cannot be empty" });
      }

      // Проверка пароля, если он пришел
      if (
        updateData.password !== undefined &&
        updateData.password.trim() === ""
      ) {
        return res
          .status(400)
          .json({ error: "Password cannot be empty if provided" });
      }

      const updatedUser = await this._userService.update({
        id: userId,
        ...updateData,
      });

      res.status(200).json({
        data: updatedUser,
        message: "User updated successfully",
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request<{ search: string }, {}, {}>, res: Response) {
    try {
      const { search } = req.params;

      // Проверка search параметра
      if (!search || search.trim() === "") {
        return res.status(400).json({ error: "Search query is required" });
      }

      const searchedUsers = await this._userService.search(search);

      res.status(200).json({
        data: searchedUsers,
        message: `Found ${searchedUsers.length} user(s)`,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async getAdmins(req: Request, res: Response) {
    try {
      const admins = await this._userService.findAdmins();
      res.status(200).json({ data: admins });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findByOrganizationId(
    req: Request<{ id: string }, {}, {}>,
    res: Response,
  ) {
    try {
      const { id } = req.params;
      const orgId = Number(id);

      if (isNaN(orgId) || orgId <= 0) {
        return res.status(400).json({ error: "Invalid organization ID" });
      }

      const users = await this._userService.findByOrganizationId(orgId);

      res.status(200).json({
        data: users,
        message: `Found ${users.length} user(s)`,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async getAvailableManagers(req: Request, res: Response) {
    try {
      const availableManagers = await this._userService.getAvailableManagers();
      res.status(200).json({ data: availableManagers });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
