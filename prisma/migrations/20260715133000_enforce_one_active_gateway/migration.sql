-- Ensure the database itself never permits two active gateways for one school.
CREATE UNIQUE INDEX "PaymentGateway_one_active_per_school"
ON "PaymentGateway" ("schoolId")
WHERE "isActive" = true;
