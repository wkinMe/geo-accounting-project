// tests/integrations/UserService.test.ts
import { UserService } from "../../../src/services/UserService";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { RefreshTokenRepository } from "../../../src/repositories/RefreshTokenRepository";
import { OrganizationService } from "../../../src/services/OrganizationService";
import { OrganizationRepository } from "../../../src/repositories/OrganizationRepository";
import { testPool } from "../../../src/db";
import { USER_ROLES } from "@shared/constants";
import { UpdateUserDTO } from "@shared/dto";
import { Organization } from "../../../src/domain/entities/Organization";
import bcrypt from "bcrypt";

describe("UserService Integration Tests", () => {
  let userService: UserService;
  let userRepo: UserRepository;
  let refreshTokenRepo: RefreshTokenRepository;
  let organizationRepo: OrganizationRepository;
  let organizationService: OrganizationService;
  let testOrganizationId: number;
  let testUserId: number;

  beforeAll(async () => {
    userRepo = new UserRepository(testPool);
    refreshTokenRepo = new RefreshTokenRepository(testPool);
    organizationRepo = new OrganizationRepository(testPool);
    organizationService = new OrganizationService(organizationRepo);
    userService = new UserService(
      userRepo,
      refreshTokenRepo,
      organizationService,
    );

    const org = Organization.create(
      "Тестовая организация для пользователей",
      52.4345,
      30.95,
    );
    const savedOrg = await organizationRepo.save(org);
    testOrganizationId = savedOrg.id!;

    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    await testPool.query(
      `INSERT INTO app_users (name, organization_id, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [
        "superadmin",
        testOrganizationId,
        hashedPassword,
        USER_ROLES.SUPER_ADMIN,
      ],
    );
  });

  afterAll(async () => {
    await testPool.query("DELETE FROM tokens CASCADE");
    await testPool.query("DELETE FROM app_users CASCADE");
    await testPool.query("DELETE FROM organizations CASCADE");
    await testPool.end();
  });

  test("регистрация нового пользователя", async () => {
    const result = await userService.register({
      name: "newuser",
      password: "password123",
      organization_id: testOrganizationId,
      role: USER_ROLES.USER,
    });
    testUserId = result.user.id!;
    expect(result.user.name).toBe("newuser");
    expect(result.user.role).toBe(USER_ROLES.USER);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  test("регистрация с существующим именем вызывает ошибку", async () => {
    await expect(
      userService.register({
        name: "newuser",
        password: "password123",
        organization_id: testOrganizationId,
        role: USER_ROLES.USER,
      }),
    ).rejects.toThrow("Пользователь с таким именем уже существует");
  });

  test("регистрация с паролем менее 6 символов вызывает ошибку", async () => {
    await expect(
      userService.register({
        name: "shortpass",
        password: "123",
        organization_id: testOrganizationId,
        role: USER_ROLES.USER,
      }),
    ).rejects.toThrow("Пароль должен содержать минимум 6 символов");
  });

  test("вход с корректными учетными данными", async () => {
    await userService.register({
      name: "logintest",
      password: "loginpass123",
      organization_id: testOrganizationId,
    });

    const result = await userService.login("logintest", "loginpass123");
    expect(result.user.name).toBe("logintest");
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  test("вход с неверным паролем вызывает ошибку", async () => {
    await expect(
      userService.login("logintest", "wrongpassword"),
    ).rejects.toThrow("Неверное имя пользователя или пароль");
  });

  test("вход с несуществующим именем вызывает ошибку", async () => {
    await expect(userService.login("nonexistent", "password")).rejects.toThrow(
      "Неверное имя пользователя или пароль",
    );
  });

  test("поиск пользователя по ID", async () => {
    const found = await userService.findById(testUserId);
    expect(found.id).toBe(testUserId);
  });

  test("поиск несуществующего пользователя вызывает ошибку", async () => {
    await expect(userService.findById(99999)).rejects.toThrow(
      "Пользователь с ID 99999 не найден",
    );
  });

  test("обновление имени пользователя", async () => {
    const updateData: UpdateUserDTO = {
      id: testUserId,
      name: "updatedusername",
    };
    const updated = await userService.update(
      testUserId,
      updateData,
      USER_ROLES.SUPER_ADMIN,
    );
    expect(updated.name).toBe("updatedusername");
  });

  test("обновление с пустым именем вызывает ошибку", async () => {
    const updateData: UpdateUserDTO = {
      id: testUserId,
      name: "",
    };
    await expect(
      userService.update(testUserId, updateData, USER_ROLES.SUPER_ADMIN),
    ).rejects.toThrow("Имя пользователя не может быть пустым");
  });

  test("получение списка пользователей с пагинацией", async () => {
    const result = await userService.findAll();
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });
});
