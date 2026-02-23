import express from "express";
import router from "./routes"; // Импортируем основной роутер

const PORT = 3112;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Лучше добавить extended: true

// Подключаем все роуты с префиксом /api
app.use("/api", router);

app.use((req, res) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.listen(PORT, () => {
  console.log(`Server is ready on port ${PORT}`);
});
