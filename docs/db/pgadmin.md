# pgAdmin

Веб-интерфейс для Postgres. Поднят вторым сервисом в `docker-compose.yml`, в одной Docker-сети с `postgres` — сервисы видят друг друга по имени, а не по `localhost`.

## Переменные окружения (`.env`)

```env
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin_password
PGADMIN_PORT=5050
```

`PGADMIN_EMAIL` — логин в pgAdmin, реальным быть не обязан (формат email нужен, письма не отправляются).

## Сервис в `docker-compose.yml`

```yaml
pgadmin:
  image: dpage/pgadmin4:latest
  container_name: pgadmin
  restart: unless-stopped
  environment:
    PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
    PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
  ports:
    - "${PGADMIN_PORT}:80"
  volumes:
    - pgadmin-data:/var/lib/pgadmin
  depends_on:
    postgres:
      condition: service_healthy
```

- `pgadmin-data` — volume под настройки pgAdmin (сохранённые серверы, пароли, preferences). Без него подключение к БД придётся настраивать заново при каждом пересоздании контейнера.
- Порт `80` — внутренний, слушает сам pgAdmin. Наружу пробрасывается на `PGADMIN_PORT` (`5050`).
- `depends_on: condition: service_healthy` — pgAdmin стартует только после прохождения healthcheck у `postgres`, а не сразу после запуска контейнера.

## Запуск

```bash
docker compose up -d
docker compose ps   # оба контейнера Up, pgadmin не в рестарт-луп
```

## Подключение к БД через веб-интерфейс

1. Открыть `http://localhost:5050` (или другой `PGADMIN_PORT`).
2. Войти — email/пароль из `PGADMIN_EMAIL` / `PGADMIN_PASSWORD`.
3. Левая панель → правый клик **Servers** → **Register** → **Server...**

**General:**
- **Name** — произвольный ярлык, например `personal_finance`.

**Connection:**
| Поле | Значение |
|---|---|
| Host name/address | `postgres` (имя сервиса, **не** `localhost`) |
| Port | `5432` (внутренний порт контейнера, не `POSTGRES_PORT`) |
| Maintenance database | `${POSTGRES_DB}` |
| Username | `${POSTGRES_USER}` |
| Password | `${POSTGRES_PASSWORD}` |

Галочка **Save password** — чтобы не вводить пароль каждый раз (хранится в volume `pgadmin-data`).

**Save.**

После подключения в дереве: `personal_finance → Databases → <POSTGRES_DB> → Schemas → public → Tables` — там `users`, `accounts`, `categories`, `transactions`, `securities`, `trades`. Данные — через **View/Edit Data**, произвольный SQL — через **Query Tool**.

## Частая ошибка

Host `localhost` вместо `postgres` → `could not connect to server` / `connection refused`. Причина: pgAdmin ищет Postgres на себе же (внутри своего контейнера `localhost` — это сам контейнер pgAdmin). Внутри Docker-сети адресация — по именам сервисов; `localhost` работает только для подключения с хост-машины к проброшенным портам.
