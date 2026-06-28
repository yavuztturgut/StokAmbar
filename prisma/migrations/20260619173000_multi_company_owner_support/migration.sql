BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[Account]
ADD [ownerId] INT NULL;

EXEC sp_executesql N'
UPDATE a
SET [ownerId] = u.[id]
FROM [dbo].[Account] a
INNER JOIN [dbo].[User] u ON u.[accountId] = a.[id]
WHERE a.[ownerId] IS NULL;
';

EXEC sp_executesql N'
UPDATE [dbo].[Account]
SET [ownerId] = (
  SELECT TOP 1 [id]
  FROM [dbo].[User]
  ORDER BY [id] ASC
)
WHERE [ownerId] IS NULL;
';

ALTER TABLE [dbo].[Account]
ALTER COLUMN [ownerId] INT NOT NULL;

ALTER TABLE [dbo].[User]
ALTER COLUMN [accountId] INT NULL;

CREATE NONCLUSTERED INDEX [Account_ownerId_idx] ON [dbo].[Account]([ownerId]);

ALTER TABLE [dbo].[Account]
ADD CONSTRAINT [Account_ownerId_fkey]
FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
