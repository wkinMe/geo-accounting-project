import { Request, Response } from "express";
import { UserService } from "../services";
import { baseErrorHandling } from "../utils/errors.utils";
import { UpdateUserDTO } from "../dto/UserDTO";

export class UserController {
  private _userService: UserService;

  constructor(service: UserService) {
    this._userService = service;
  }

  async findAll(req: Request, res: Response) {
    try {
      const users = await this._userService.findAll();

      res.status(200).json({
        data: users,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const user = await this._userService.findById(Number(req.params.id));

      res.status(200).json({
        data: user,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deletedUser = await this._userService.delete(Number(req.params.id));

      res.status(200).json({
        data: deletedUser,
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
      const { id } = req.params; // id из route параметра
      const updateData = req.body; // Данные для обновления из тела запроса

      const userId = parseInt(id, 10);

      if (isNaN(userId)) {
        return res.status(400).json({
          error: "Invalid user ID",
          message: "User ID must be a valid number",
        });
      }

      const updatedUser = await await this._userService.update({
        id: userId,
        ...updateData,
      });

      // Исправлено: 200 для обновления, а не 201
      res.status(200).json({
        data: updatedUser,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async search(req: Request<{ search: string }, {}, {}>, res: Response) {
    try {
      const { search } = req.params;

      const searchedUsers = await this._userService.search(search);

      res.send(200).json({
        data: searchedUsers,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async getAdmins(req: Request, res: Response) {
    try {
      const admins = await this._userService.findAdmins();

      res.send(200).json({
        data: admins,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async findByOrganizationId(
    req: Request<{ id: number }, {}, {}>,
    res: Response,
  ) {
    try {
      const { id } = req.params;
      const users = await this._userService.findByOrganizationId(id);

      res.json(200).json({
        data: users,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }

  async getAvailableManagers(req: Request, res: Response) {
    try {
      const availableManagers = await this._userService.getAvailableManagers();

      res.send(200).json({
        data: availableManagers,
      });
    } catch (e) {
      baseErrorHandling(e, res);
    }
  }
}
