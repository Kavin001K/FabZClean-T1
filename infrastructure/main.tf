variable "app_name" {
  default = "fabzclean"
}

provider "aws" {
  region = "us-east-1"
}

# 1. Static Assets Bucket (S3)
resource "aws_s3_bucket" "static_assets" {
  bucket = "${var.app_name}-assets"
}

resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# 2. Database (RDS Postgres)
resource "aws_db_instance" "default" {
  identifier           = "${var.app_name}-db"
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "16.3"
  instance_class       = "db.t3.micro"
  db_name              = "fabzclean"
  username             = "admin"
  password             = "MUST_CHANGE_THIS_PASSWORD_123!" # Use Secrets Manager in prod
  parameter_group_name = "default.postgres16"
  skip_final_snapshot  = true
  publicly_accessible  = false
}

# 3. ECS Cluster (for Docker)
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
}

# 4. ECR Repository
resource "aws_ecr_repository" "app" {
  name = var.app_name
}

output "db_endpoint" {
  value = aws_db_instance.default.endpoint
}

output "s3_bucket" {
  value = aws_s3_bucket.static_assets.id
}
