# from typing import List, Optional
# from datetime import datetime
# from enum import Enum
# from sqlmodel import Field, Relationship, SQLModel

# # 1. Department Table (부서 테이블)
# class Department(SQLModel, table=True):
#     __tablename__ = "departments"

#     id: Optional[int] = Field(default=None, primary_key=True)
#     name: str = Field(index=True, unique=True, max_length=255)

#     # 관계 정의
#     projects: List["Project"] = Relationship(back_populates="department")
#     users_managing: List["UserDepartment"] = Relationship(back_populates="department")
#     users_belonging: List["User"] = Relationship(back_populates="department_belonging")


# # 2. Project Table (프로젝트 테이블)
# class Project(SQLModel, table=True):
#     __tablename__ = "projects"

#     id: Optional[int] = Field(default=None, primary_key=True)
#     name: str = Field(index=True, unique=True, max_length=255)
#     creation_date: datetime = Field(default_factory=datetime.now)

#     department_id: Optional[int] = Field(default=None, foreign_key="departments.id")
#     department: Optional[Department] = Relationship(back_populates="projects")

#     # 관계 정의
#     documents: List["Document"] = Relationship(back_populates="project")
#     users_assigned: List["UserProject"] = Relationship(back_populates="project")


# # 사용자 권한 Enum (프론트엔드의 `UserRole` 타입과 직접 매핑)
# class UserRoleEnum(str, Enum):
#     SUPER_ADMIN = "총괄 관리자"
#     ADMIN = "관리자"
#     STANDARD_USER = "일반 사용자"


# # 3. User Table (사용자 테이블)
# class User(SQLModel, table=True):
#     __tablename__ = "users"

#     id: Optional[int] = Field(default=None, primary_key=True)
#     name: str = Field(index=True, max_length=255)
#     email: str = Field(index=True, unique=True, max_length=255)
#     role: UserRoleEnum = Field(default=UserRoleEnum.STANDARD_USER)

#     # 다대다 관계 정의: 사용자가 관리하는 부서
#     managed_departments: List["UserDepartment"] = Relationship(back_populates="user")

#     # 일대다 관계 정의: 사용자가 소속된 부서 (단일 부서)
#     department_id: Optional[int] = Field(default=None, foreign_key="departments.id")
#     department_belonging: Optional[Department] = Relationship(back_populates="users_belonging")

#     # 다대다 관계 정의: 사용자가 할당된 프로젝트
#     assigned_projects: List["UserProject"] = Relationship(back_populates="user")

#     # 일대다 관계 정의: 사용자가 업로드한 문서
#     documents_uploaded: List["Document"] = Relationship(back_populates="uploader")


# # 4. User-Department 조인 테이블 (managedDepartmentIds)
# # 한 사용자가 여러 부서를 관리하고, 한 부서가 여러 사용자에게 관리될 수 있는 다대다 관계를 처리합니다.
# class UserDepartment(SQLModel, table=True):
#     __tablename__ = "user_departments"

#     user_id: Optional[int] = Field(default=None, foreign_key="users.id", primary_key=True)
#     department_id: Optional[int] = Field(default=None, foreign_key="departments.id", primary_key=True)

#     # 관계 정의
#     user: Optional[User] = Relationship(back_populates="managed_departments")
#     department: Optional[Department] = Relationship(back_populates="users_managing")


# # 5. User-Project 조인 테이블 (projectIds)
# # 한 사용자가 여러 프로젝트에 속하고, 한 프로젝트에 여러 사용자가 속할 수 있는 다대다 관계를 처리합니다.
# class UserProject(SQLModel, table=True):
#     __tablename__ = "user_projects"

#     user_id: Optional[int] = Field(default=None, foreign_key="users.id", primary_key=True)
#     project_id: Optional[int] = Field(default=None, foreign_key="projects.id", primary_key=True)

#     # 관계 정의
#     user: Optional[User] = Relationship(back_populates="assigned_projects")
#     project: Optional[Project] = Relationship(back_populates="users_assigned")


# # 6. Document Table (문서 테이블)
# class Document(SQLModel, table=True):
#     __tablename__ = "documents"

#     id: Optional[int] = Field(default=None, primary_key=True)
#     name: str = Field(index=True, max_length=255)
#     location: str = Field(max_length=255)
#     created_at: datetime = Field(default_factory=datetime.now)
#     status: str = Field(max_length=50)
#     completed_at: Optional[datetime] = Field(default=None)

#     project_id: Optional[int] = Field(default=None, foreign_key="projects.id")
#     project: Optional[Project] = Relationship(back_populates="documents")

#     uploader_id: Optional[int] = Field(default=None, foreign_key="users.id")
#     uploader: Optional[User] = Relationship(back_populates="documents_uploaded")
