BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [accountId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[Account] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Account_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Account_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Account_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Ingredient] (
    [id] INT NOT NULL IDENTITY(1,1),
    [accountId] INT NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [unit] NVARCHAR(1000) NOT NULL,
    [currentStock] FLOAT(53) NOT NULL CONSTRAINT [Ingredient_currentStock_df] DEFAULT 0,
    [minStockLevel] FLOAT(53) NOT NULL CONSTRAINT [Ingredient_minStockLevel_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Ingredient_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Ingredient_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[StockTransaction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [accountId] INT NOT NULL,
    [ingredientId] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [quantity] FLOAT(53) NOT NULL,
    [note] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [StockTransaction_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [StockTransaction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ActivityLog] (
    [id] INT NOT NULL IDENTITY(1,1),
    [accountId] INT NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [ingredientId] INT,
    [ingredientName] NVARCHAR(1000) NOT NULL,
    [quantity] FLOAT(53),
    [details] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ActivityLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ActivityLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_accountId_idx] ON [dbo].[User]([accountId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_email_idx] ON [dbo].[User]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ingredient_accountId_idx] ON [dbo].[Ingredient]([accountId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [StockTransaction_accountId_idx] ON [dbo].[StockTransaction]([accountId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ActivityLog_accountId_idx] ON [dbo].[ActivityLog]([accountId]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_accountId_fkey] FOREIGN KEY ([accountId]) REFERENCES [dbo].[Account]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Ingredient] ADD CONSTRAINT [Ingredient_accountId_fkey] FOREIGN KEY ([accountId]) REFERENCES [dbo].[Account]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[StockTransaction] ADD CONSTRAINT [StockTransaction_accountId_fkey] FOREIGN KEY ([accountId]) REFERENCES [dbo].[Account]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StockTransaction] ADD CONSTRAINT [StockTransaction_ingredientId_fkey] FOREIGN KEY ([ingredientId]) REFERENCES [dbo].[Ingredient]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ActivityLog] ADD CONSTRAINT [ActivityLog_accountId_fkey] FOREIGN KEY ([accountId]) REFERENCES [dbo].[Account]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
