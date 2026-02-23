import { CreateUserDTO, UpdateUserDTO } from "@src/dto/UserDTO";
import { UserService } from "@src/services";
import { baseErrorHandling } from "@src/utils";
import { Request, Response } from "express";
import { Pool } from "pg";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@src/constants/messages";

export class UserController {
  private _userService: UserService;
  private entityName = "user";

  constructor(dbConnection: Pool) {
    this._userService = new UserService(dbConnection);
  }

  async findAll(req: Request, res: Response) {
    try {
      const users = await this._userService.findAll();
      res.status(200).json({
        data: users,
        message: SUCCESS_MESSAGES.FIND_ALL(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      const user = await this._userService.findById(id);
      res.status(200).json({
        data: user,
        message: SUCCESS_MESSAGES.FIND_BY_ID(this.entityName, id),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      const deletedUser = await this._userService.delete(id);
      res.status(200).json({
        data: deletedUser,
        message: SUCCESS_MESSAGES.DELETE(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async create(req: Request<{}, {}, CreateUserDTO>, res: Response) {
    try {
      const createData = req.body;

      if (!createData || typeof createData !== "object") {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUEST_BODY_REQUIRED,
        });
      }

      if (!createData.name || createData.name.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("User name"),
        });
      }

      if (!createData.organization_id) {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("Organization ID"),
        });
      }

      if (!createData.password || createData.password.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.REQUIRED_FIELD("Password"),
        });
      }

      const createdUser = await this._userService.create(createData);
      res.status(201).json({
        data: createdUser,
        message: SUCCESS_MESSAGES.CREATE(this.entityName),
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
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT(this.entityName),
        });
      }

      if (
        !updateData ||
        typeof updateData !== "object" ||
        Object.keys(updateData).length === 0
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.UPDATE_DATA_REQUIRED,
        });
      }

      if (updateData.name !== undefined && updateData.name.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("User name"),
        });
      }

      if (
        updateData.organization_id !== undefined &&
        updateData.organization_id.trim() === ""
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("Organization ID"),
        });
      }

      if (
        updateData.password !== undefined &&
        updateData.password.trim() === ""
      ) {
        return res.status(400).json({
          message: ERROR_MESSAGES.EMPTY_FIELD("Password"),
        });
      }

      const updatedUser = await this._userService.update({
        id: userId,
        ...updateData,
      });

      res.status(200).json({
        data: updatedUser,
        message: SUCCESS_MESSAGES.UPDATE(this.entityName),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request<{}, {}, {}, {q?: string}>, res: Response) {
    try {
      const { q } = req.query;

      if (!q || q.trim() === "") {
        return res.status(400).json({
          message: ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        });
      }

      const searchedUsers = await this._userService.search(q);

      res.status(200).json({
        data: searchedUsers,
        message: SUCCESS_MESSAGES.SEARCH(this.entityName, searchedUsers.length),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async getAdmins(req: Request, res: Response) {
    try {
      const admins = await this._userService.findAdmins();
      res.status(200).json({
        data: admins,
        message: SUCCESS_MESSAGES.GET_ADMINS(admins.length),
      });
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
        return res.status(400).json({
          message: ERROR_MESSAGES.INVALID_ID_FORMAT("organization"),
        });
      }

      const users = await this._userService.findByOrganizationId(orgId);

      // Проверяем, есть ли пользователи
      if (users.length === 0) {
        return res.status(200).json({
          data: users,
          message: SUCCESS_MESSAGES.FIND_BY_ORGANIZATION(
            this.entityName,
            0,
            "Unknown", // или можно получить название организации из другого источника
          ),
        });
      }

      res.status(200).json({
        data: users,
        message: SUCCESS_MESSAGES.FIND_BY_ORGANIZATION(
          this.entityName,
          users.length,
          users[0].organization.name,
        ),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async getAvailableManagers(req: Request, res: Response) {
    try {
      const availableManagers = await this._userService.getAvailableManagers();
      res.status(200).json({
        data: availableManagers,
        message: SUCCESS_MESSAGES.GET_AVAILABLE_MANAGERS(
          availableManagers.length,
        ),
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
