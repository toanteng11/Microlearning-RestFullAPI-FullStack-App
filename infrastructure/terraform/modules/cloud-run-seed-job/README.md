# Cloud Run Seed Job Module

Private on-demand Staging job dùng cùng exact image digest với service. Job chạy một task, không retry tự
động, không schedule và không public invoker. Password seed cùng runtime secrets được mount từ exact Secret
Manager versions qua dedicated `ml-seed-staging` identity.
