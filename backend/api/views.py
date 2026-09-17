from django.core.mail import send_mail
from django.contrib.auth.hashers import check_password,make_password
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from .models import Staff, Task as TaskModel, Admin, DirectorsTask, PasswordResetOTP, Arrival
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Count
from .serializer import (
    SignupSerializer, StaffSerializer, LoginSerializer, TaskSerializer,
    AdminSerializer, AdminLoginSerializer, DirectorsTaskSerializer,
    ForgotPasswordSerializer, VerifyOTPSerializer, ResetPasswordSerializer,ArrivalSerializer
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from uuid import uuid4
import secrets
import random
import urllib.request


def authenticate_staff(request):
    auth = request.headers.get("Authorization")
    cookie = request.COOKIES.get("refresh_cookie")
    if not auth:
        return None
    auth_db = Staff.objects.filter(auth=auth).first()
    if not auth_db:
        return None
    if auth_db.expire_auth():
        if not cookie:
            return None
        refresh_token = Staff.objects.filter(refresh=cookie).first()
        if not refresh_token or refresh_token.expire_refresh():
            return None
        return refresh_token
    return auth_db


def apply_filter_search(queryset, request):
    q = request.GET.get("q", "").strip()
    if q:
        queryset = queryset.filter(task__icontains=q)
    filt = request.GET.get("filter", "")
    today = timezone.now().date()
    if filt == "day":
        queryset = queryset.filter(date=today)
    elif filt == "week":
        week_ago = today - timedelta(days=7)
        queryset = queryset.filter(date__gte=week_ago, date__lte=today)
    elif filt == "month":
        first_of_month = today.replace(day=1)
        queryset = queryset.filter(date__gte=first_of_month, date__lte=today)
    return queryset


def upload_image_to_catbox(photo):
    boundary = "----TaskTrackerBoundary" + uuid4().hex
    safe_name = photo.name.replace(" ", "_") or "photo.jpg"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="reqtype"\r\n\r\n'
        f"fileupload\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="fileToUpload"; filename="{safe_name}"\r\n'
        f"Content-Type: application/octet-stream\r\n\r\n"
    ).encode("utf-8") + photo.read() + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = urllib.request.Request(
        "https://catbox.moe/user/api.php",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8").strip()


class Signup(APIView):

    def post(self,request):
        serializer=SignupSerializer(data=request.data)
        print(request.data)
        if serializer.is_valid():
          info=serializer.validated_data
        
          email=info.get("email")
          password=info.get("password")
          role = info.get('role')
          staff=Staff.objects.filter(Email=email).first()
          if staff:
              return Response({"info":"User exists"},status=status.HTTP_302_FOUND)
              
        #   role = info.get('role')
          staff=Staff.objects.create(
              Name=info.get('name'),
              Email=info.get('email'),
              dpt=info.get('dept'),
              password=make_password(password),
              role=role
              
          )
        
        
          return Response({"info":"Successful Signup","status":"You can navigate to the login page"},status=status.HTTP_201_CREATED)
        else:
            # print(serializer.errors)
            return Response({"info":serializer.errors},status=status.HTTP_400_BAD_REQUEST)
            
            
            
        
class Login(APIView):
    
    
    def get(self,request):
        #  get all the email with this company
        staff=Staff.objects.all()
        # unable to the staff
        if not staff:
            return Response({"info":"Unable to get the staffs"},status=status.HTTP_404_NOT_FOUND)
        
        staff_email=[]
        for i in staff:
            staff_email.append(i.Email)
        return Response({"info":staff_email},status=status.HTTP_200_OK)
        
        
        
 
    def post(self,request):
        serializer=LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"info":serializer.errors},status=status.HTTP_400_BAD_REQUEST)
        info=serializer.validated_data
        email=info.get("email")
        password=info.get("password")
        staff=Staff.objects.filter(Email=email).first()
        if not staff:
            return Response({"info":"Staff not found"},status=status.HTTP_404_NOT_FOUND)
        if not check_password(password,staff.password):
            return Response({"info":"Password Unable to be Authenticated"},status=status.HTTP_401_UNAUTHORIZED)
        auth_token=secrets.token_hex(32)
        refresh=secrets.token_hex(64)
        staff.auth=auth_token
        staff.refresh=refresh
        staff.auth_created_at=timezone.now()
        staff.auth_expire_at=timezone.now()+timedelta(days=30)
        staff.refresh_created_at=timezone.now()
        staff.refresh_expire_at=timezone.now()+timedelta(days=60)
        staff.save()
        response=Response({"info":"User Authenticated","role":staff.role,"dpt":staff.dpt},headers={"Authorization":auth_token},status=status.HTTP_201_CREATED)
        response.set_cookie(
            key="refresh_cookie",
            value=refresh,
            httponly=True,
            samesite='Lax',
            secure=False,)
        return response

        

    
      
class History(APIView):
    def get(self,request):
        auth=request.headers.get("Authorization")
        cookie=request.COOKIES.get("refresh_cookie")
        if not auth:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        auth_db=Staff.objects.filter(auth=auth).first()
        if not auth_db:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        if auth_db.expire_auth():
            if not cookie:
                return Response({"info":"Unable to get cookie"},status=status.HTTP_400_BAD_REQUEST)
            refresh_token=Staff.objects.filter(refresh=cookie).first()
            if not refresh_token:
                return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
            if refresh_token.expire_refresh():
                return Response({"info":"Login Cookie expired, Login again"},status=status.HTTP_400_BAD_REQUEST)
            staff=refresh_token
        else:
            staff=auth_db
        task=TaskModel.objects.filter(staff=staff, group__isnull=True)
        task = apply_filter_search(task, request)
        serializer=TaskSerializer(task,many=True)
        data = serializer.data
        for item in data:
            t = task.get(id=item['id'])
            item['progress'] = t.progress
            item['completion_date'] = t.completion_date
            item['subtasks'] = [
                {
                    "id": s.id,
                    "number": s.number,
                    "task": s.task,
                    "description": s.description,
                    "status": s.status,
                    "progress": s.progress,
                    "completion_date": s.completion_date,
                }
                for s in t.subtasks.all().order_by('number')
            ]
        return Response({"info":data, "staff_name": staff.Name},status=status.HTTP_200_OK)


class ProfileUpdate(APIView):
    def get(self, request):
        auth=request.headers.get("Authorization")
        if not auth:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        staff=Staff.objects.filter(auth=auth).first()
        if not staff:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        return Response({"id":staff.id,"name":staff.Name,"email":staff.Email,"dept":staff.dpt,"role":staff.role,"photo":staff.photo},status=status.HTTP_200_OK)

    def put(self, request):
        auth=request.headers.get("Authorization")
        if not auth:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        staff=Staff.objects.filter(auth=auth).first()
        if not staff:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        name=request.data.get("name")
        email=request.data.get("email")
        dept=request.data.get("dept")
        role=request.data.get("role")
        if name:
            staff.Name=name
        if email:
            staff.Email=email
        if dept:
            staff.dpt=dept
        if role:
            staff.role=role
        staff.save()
        return Response({"info":"Profile updated","name":staff.Name,"email":staff.Email,"dept":staff.dpt,"role":staff.role,"photo":staff.photo},status=status.HTTP_200_OK)


class ProfilePhotoUpload(APIView):
    def post(self, request):
        auth=request.headers.get("Authorization")
        if not auth:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        staff=Staff.objects.filter(auth=auth).first()
        if not staff:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        photo=request.FILES.get("photo")
        if not photo:
            return Response({"info":"No photo provided"},status=status.HTTP_400_BAD_REQUEST)
        if photo.size > 10 * 1024 * 1024:
            return Response({"info":"Photo is too large (max 10MB)"},status=status.HTTP_400_BAD_REQUEST)
        try:
            uploaded_url=upload_image_to_catbox(photo)
        except Exception as e:
            return Response({"info":f"Upload to image host failed: {str(e)}"},status=status.HTTP_502_BAD_GATEWAY)
        if not uploaded_url.startswith("http"):
            return Response({"info":"Image host rejected the upload"},status=status.HTTP_502_BAD_GATEWAY)
        staff.photo=uploaded_url
        staff.save()
        return Response({"info":"Photo updated","photo":uploaded_url},status=status.HTTP_200_OK)


            
class Task(APIView):
    

    def post(self, request):
        serializer=TaskSerializer(data=request.data)
        auth=request.headers.get("Authorization")
        cookie=request.COOKIES.get("refresh_cookie")
        if not auth:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        auth_db=Staff.objects.filter(auth=auth).first()
        if not auth_db:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        if auth_db.expire_auth():
            if not cookie:
                return Response({"info":"Unable to get cookie"},status=status.HTTP_400_BAD_REQUEST)
            refresh_token=Staff.objects.filter(refresh=cookie).first()
            if not refresh_token:
                return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
            if refresh_token.expire_refresh():
                return Response({"info":"Login Cookie expired, Login again"},status=status.HTTP_400_BAD_REQUEST)
            staff=refresh_token
        else:
            staff=auth_db
        if serializer.is_valid():
            main_task = serializer.save(staff=staff)
            subtask_list = request.data.get('list') or []
            for i, item in enumerate(subtask_list, start=1):
                if not (item.get('task') or '').strip():
                    continue
                TaskModel.objects.create(
                    staff=staff,
                    group=main_task,
                    number=item.get('number') if 'number' in item else i,
                    task=item.get('task'),
                    description=item.get('description') or '',
                    status=item.get('status') or main_task.status,
                    progress=item.get('progress') or main_task.progress,
                    completion_date=item.get('completion_date') or main_task.completion_date,
                )
            return Response({"info": "Task Added successfully", "id": main_task.id}, status=status.HTTP_201_CREATED)
        return Response({"info": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, id):
        auth=request.headers.get("Authorization")
        if not auth:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        staff=Staff.objects.filter(auth=auth).first()
        if not staff:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        if staff.expire_auth():
            cookie=request.COOKIES.get("refresh_cookie")
            if not cookie:
                return Response({"info":"Unable to get cookie"},status=status.HTTP_400_BAD_REQUEST)
            refresh_token=Staff.objects.filter(refresh=cookie).first()
            if not refresh_token:
                return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
            if refresh_token.expire_refresh():
                return Response({"info":"Login Cookie expired, Login again"},status=status.HTTP_400_BAD_REQUEST)
            staff=refresh_token
        task=TaskModel.objects.filter(id=id, staff=staff).first()
        if not task:
            return Response({"info":"Task not found"},status=status.HTTP_404_NOT_FOUND)
        serializer=TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            if task.moved_from and (
                task.progress == "100%"
                or (task.status or "").strip().lower() == "completed"
            ):
                TaskModel.objects.filter(pk=task.moved_from.pk).update(
                    status="Completed",
                    progress="100%",
                )
            return Response({"info":"Task updated"},status=status.HTTP_200_OK)
        return Response({"info":serializer.errors},status=status.HTTP_400_BAD_REQUEST)


class TaskMoveView(APIView):
    def post(self, request, id):
        auth=request.headers.get("Authorization")
        cookie=request.COOKIES.get("refresh_cookie")
        if not auth:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        auth_db=Staff.objects.filter(auth=auth).first()
        if not auth_db:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        if auth_db.expire_auth():
            if not cookie:
                return Response({"info":"Unable to get cookie"},status=status.HTTP_400_BAD_REQUEST)
            refresh_token=Staff.objects.filter(refresh=cookie).first()
            if not refresh_token:
                return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
            if refresh_token.expire_refresh():
                return Response({"info":"Login Cookie expired, Login again"},status=status.HTTP_400_BAD_REQUEST)
            staff=refresh_token
        else:
            staff=auth_db
        task=TaskModel.objects.filter(id=id, staff=staff, group__isnull=True).first()
        if not task:
            return Response({"info":"Task not found"},status=status.HTTP_404_NOT_FOUND)
        if (task.status or "").strip().lower() == "completed":
            return Response({"info":"Completed tasks can't be moved"},status=status.HTTP_400_BAD_REQUEST)
        today = timezone.now().date()
        if TaskModel.objects.filter(moved_from=task, date=today).exists():
            return Response({"info":"This task was already moved to today"},status=status.HTTP_400_BAD_REQUEST)
        new_task = TaskModel.objects.create(
            staff=staff,
            task=task.task,
            description=task.description,
            status="In Progress",
            progress="10%",
            moved_from=task,
        )
        for s in task.subtasks.all().order_by('number'):
            TaskModel.objects.create(
                staff=staff,
                group=new_task,
                number=s.number,
                task=s.task,
                description=s.description,
                status=s.status,
                progress=s.progress,
                completion_date=s.completion_date,
            )
        return Response({"info":"Task moved to today","id":new_task.id},status=status.HTTP_201_CREATED)

class DirectorTaskView(APIView):
    def post(self, request):
        serializer=DirectorsTaskSerializer(data=request.data)
        auth=request.headers.get("Authorization")
        cookie=request.COOKIES.get("refresh_cookie")
        if not auth:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        auth_db=Staff.objects.filter(auth=auth).first()
        if not auth_db:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        if auth_db.expire_auth():
            if not cookie:
                return Response({"info":"Unable to get cookie"},status=status.HTTP_400_BAD_REQUEST)
            refresh_token=Staff.objects.filter(refresh=cookie).first()
            if not refresh_token:
                return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
            if refresh_token.expire_refresh():
                return Response({"info":"Login Cookie expired, Login again"},status=status.HTTP_400_BAD_REQUEST)
            staff=refresh_token
        else:
            staff=auth_db
        if not serializer.is_valid():
            return Response({"info": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        DirectorsTask.objects.create(
            staff=staff,
            task=serializer.validated_data.get('task'),
            status=serializer.validated_data.get('status', 'In progress'),
            description=serializer.validated_data.get('description', '')
        )
        return Response({"info": "Director task added successfully"}, status=status.HTTP_201_CREATED)

class DirectorHistoryView(APIView):
    def get(self, request):
        auth=request.headers.get("Authorization")
        cookie=request.COOKIES.get("refresh_cookie")
        if not auth:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        auth_db=Staff.objects.filter(auth=auth).first()
        if not auth_db:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        if auth_db.expire_auth():
            if not cookie:
                return Response({"info":"Unable to get cookie"},status=status.HTTP_400_BAD_REQUEST)
            refresh_token=Staff.objects.filter(refresh=cookie).first()
            if not refresh_token:
                return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
            if refresh_token.expire_refresh():
                return Response({"info":"Login Cookie expired, Login again"},status=status.HTTP_400_BAD_REQUEST)
            director=refresh_token
        else:
            director=auth_db
        if director.role == 'director':
            serializer = DirectorsTaskSerializer(director.director_tasks.all(), many=True)
            return Response({"info": serializer.data}, status=status.HTTP_200_OK)
        return Response({"info":"Access denied"}, status=status.HTTP_403_FORBIDDEN)

class AllStaffTasksView(APIView):
    def get(self, request):
        auth=request.headers.get("Authorization")
        if not auth:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        admin=Admin.objects.filter(auth=auth).first()
        if not admin:
            return Response({"info":"Unable to Authenticate"},status=status.HTTP_400_BAD_REQUEST)
        all_tasks = TaskModel.objects.select_related('staff').filter(group__isnull=True)
        all_tasks = apply_filter_search(all_tasks, request)
        data = []
        for t in all_tasks:
            data.append({
                "id": t.id,
                "staff_name": t.staff.Name if t.staff else "Unknown",
                "staff_dpt": t.staff.dpt if t.staff else "Unknown",
                "number": t.number,
                "task": t.task,
                "description": t.description,
                "date": t.date,
                "status": t.status,
                "completion_date": t.completion_date,
                "progress": t.progress,
                "subtasks": [
                    {
                        "id": s.id,
                        "number": s.number,
                        "task": s.task,
                        "description": s.description,
                        "status": s.status,
                        "progress": s.progress,
                        "completion_date": s.completion_date,
                    }
                    for s in t.subtasks.all().order_by('number')
                ],
            })
        return Response({"info": data}, status=status.HTTP_200_OK)


    
 
                    
                
        
        
class AdminLogin(APIView):

    def post(self,request):
        serializer=AdminLoginSerializer(data=request.data)
        if serializer.is_valid():
            info=serializer.validated_data
            email=info.get("email")
            password=info.get("password")
            admin=Admin.objects.filter(Email=email).first()
            if not admin:
                return Response({"info":"No admin found"},status=status.HTTP_404_NOT_FOUND)
            if check_password(password, admin.password):
                token=secrets.token_hex(32)
                admin.auth=token
                admin.save()
                return Response({"info":"Admin login successful"},headers={"Authorization":token},status=status.HTTP_200_OK)
            return Response({"info":"Invalid credentials"},status=status.HTTP_401_UNAUTHORIZED)
        return Response({"info":serializer.errors},status=status.HTTP_400_BAD_REQUEST)


class AdminDashboard(APIView):

    def get(self,request):
        auth=request.headers.get("Authorization")
        if not auth:
            return Response({"info":"Authentication required"},status=status.HTTP_401_UNAUTHORIZED)
        admin=Admin.objects.filter(auth=auth).first()
        if not admin:
            return Response({"info":"Invalid admin session"},status=status.HTTP_401_UNAUTHORIZED)
        
        dir_staff=[]
        normal_staff=[]
        staffs=Staff.objects.all()
        for i in staffs:
            if i.role=="director":
                dir_tasks=i.director_tasks.all()
                dir_staff.append({
                    "dir_count":dir_tasks.count(),
                    "dir":i.Name,
                    "tasks":[t.task for t in dir_tasks],
                    "status":[t.status for t in dir_tasks]
                })
            else:
                staff_tasks=i.task.all()
                normal_staff.append({
                    "staff_count":staff_tasks.count(),
                    "staff_name":i.Name,
                    "staff_tasks":[t.task for t in staff_tasks],
                    "status":[t.status for t in staff_tasks]
                })
                
                
            
        total_staff=Staff.objects.count()
        dir_staffs=dir_staff
        other_staff=normal_staff
        
        all_tasks = TaskModel.objects.all()
        total_tasks=all_tasks.count()
        today = timezone.now().date()
        tasks_today = all_tasks.filter(date=today).count()
        tasks_in_progress = all_tasks.exclude(status__in=["Completed", "completed"]).count()
        completed_tasks = all_tasks.filter(status__in=["Completed", "completed"]).count()
        staff_list=StaffSerializer(Staff.objects.all(),many=True).data
        tasks_by_status=all_tasks.values("status").annotate(count=Count("id"))
        staff_task_counts=Staff.objects.annotate(task_count=Count("task")).values("Name","task_count")

        return Response({
            "admin":admin.Name,
            "dir_staffs":dir_staffs,
            "other_staff":other_staff,
            "total_employees":total_staff,
            "logged_in":total_staff,
            "tasks_today":tasks_today,
            "tasks_in_progress":tasks_in_progress,
            "completed_tasks":completed_tasks,
            "total_tasks":total_tasks,
            "tasks_by_status":list(tasks_by_status),
            "staff_task_counts":list(staff_task_counts),
            "staff_list":staff_list
        },status=status.HTTP_200_OK)


class AdminStaffList(APIView):
    def get(self, request):
        auth = request.headers.get("Authorization")
        if not auth:
            return Response({"info": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        admin = Admin.objects.filter(auth=auth).first()
        if not admin:
            return Response({"info": "Invalid admin session"}, status=status.HTTP_401_UNAUTHORIZED)
        date_param = request.GET.get("date") or str(timezone.now().date())
        att_date = date_param
        try:
            att_date = timezone.datetime.strptime(date_param, "%Y-%m-%d").date()
        except ValueError:
            att_date = timezone.now().date()
        staff_list = Staff.objects.all().order_by("Name")
        attendances = {
            a.staff_id: a
            for a in Arrival.objects.filter(date=att_date)
        }
        out = []
        for s in staff_list:
            a = attendances.get(s.id)
            out.append({
                "id": s.id,
                "Name": s.Name,
                "Email": s.Email,
                "dpt": s.dpt,
                "role": s.role,
                "photo": s.photo,
                "attendance": {
                    "time_of_arrival": a.time_of_arrival.strftime("%H:%M") if a and a.time_of_arrival else None,
                    "time_of_leave": a.time_of_leave.strftime("%H:%M") if a and a.time_of_leave else None,
                    "day": a.day if a else None,
                } if a else None,
            })
        return Response({"staff_list": out, "name": admin.Name, "date": str(att_date)}, status=status.HTTP_200_OK)


class AdminStaffDetail(APIView):
    def get(self, request, staff_id):
        auth = request.headers.get("Authorization")
        if not auth:
            return Response({"info": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        admin = Admin.objects.filter(auth=auth).first()
        if not admin:
            return Response({"info": "Invalid admin session"}, status=status.HTTP_401_UNAUTHORIZED)
        staff = Staff.objects.filter(id=staff_id).first()
        if not staff:
            return Response({"info": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)

        staff_data = {
            "id": staff.id,
            "Name": staff.Name,
            "Email": staff.Email,
            "dpt": staff.dpt,
            "role": staff.role,
            "photo": staff.photo,
            "auth_created_at": staff.auth_created_at,
            "auth_expire_at": staff.auth_expire_at,
        }
        tasks = []
        for t in staff.task.filter(group__isnull=True).order_by("-date"):
            tasks.append({
                "id": t.id,
                "number": t.number,
                "task": t.task,
                "description": t.description,
                "date": t.date,
                "status": t.status,
                "completion_date": t.completion_date,
                "progress": t.progress,
                "subtasks": [
                    {
                        "id": s.id,
                        "number": s.number,
                        "task": s.task,
                        "description": s.description,
                        "status": s.status,
                        "progress": s.progress,
                        "completion_date": s.completion_date,
                    }
                    for s in t.subtasks.all().order_by('number')
                ],
            })
        return Response({"staff": staff_data, "tasks": tasks}, status=status.HTTP_200_OK)


@staff_member_required
def admin_dashboard_view(request):
    staff_list = Staff.objects.all()
    tasks = TaskModel.objects.select_related('staff').all()
    director_tasks = DirectorsTask.objects.select_related('staff').all()

    task_data = []
    for t in tasks:
        task_data.append({
            "staff_name": t.staff.Name if t.staff else "Unassigned",
            "staff_dpt": t.staff.dpt if t.staff else "-",
            "task": t.task,
            "description": t.description,
            "date": t.date,
            "status": t.status,
        })

    dir_task_data = []
    for t in director_tasks:
        dir_task_data.append({
            "staff_name": t.staff.Name if t.staff else "Unassigned",
            "staff_dpt": t.staff.dpt if t.staff else "-",
            "task": t.task,
            "description": t.description,
            "date": t.date,
            "status": t.status,
        })

    context = {
        "total_staff": staff_list.count(),
        "total_tasks": len(task_data),
        "total_director_tasks": len(dir_task_data),
        "staff_list": staff_list,
        "tasks": task_data,
        "director_tasks": dir_task_data,
    }
    return render(request, "admin/dashboard.html", context)


class ForgotPasswordView(APIView):
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"info": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        email = serializer.validated_data["email"]

        staff = Staff.objects.filter(Email__iexact=email).first()
        admin = Admin.objects.filter(Email__iexact=email).first()
        if not staff and not admin:
            return Response({"info":"Email not found"},status=status.HTTP_404_NOT_FOUND)

        otp = str(random.randint(100000, 999999))
        matched = staff or admin
        recipient = matched.Email if matched.Email else email
        PasswordResetOTP.objects.create(
            email=recipient,
            otp=otp,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        try:
            sent = send_mail(
                subject="Password Reset OTP",
                message=f"Your OTP for password reset is: {otp}\n\nThis code expires in 10 minutes.",
                from_email=None,
                recipient_list=[recipient],
                fail_silently=False,
            )
        except Exception as e:
            return Response({"info": f"Failed to send email: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        print(f"[FORGOT-PASSWORD] OTP {otp} for {recipient} -> sent={bool(sent)}")

        return Response({"info":"OTP sent to your email"},status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"info": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]

        record = PasswordResetOTP.objects.filter(email=email, otp=otp, is_used=False).last()
        if not record:
            return Response({"info":"Invalid OTP"},status=status.HTTP_400_BAD_REQUEST)
        if record.is_expired():
            return Response({"info":"OTP has expired"},status=status.HTTP_400_BAD_REQUEST)

        reset_token = secrets.token_hex(32)
        record.reset_token = reset_token
        record.save()

        return Response({"info":"OTP verified","token":reset_token},status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"info": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        email = serializer.validated_data["email"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["password"]

        record = PasswordResetOTP.objects.filter(
            email=email, reset_token=token, is_used=False
        ).last()
        if not record:
            return Response({"info":"Invalid reset token"},status=status.HTTP_400_BAD_REQUEST)
        if record.is_expired():
            return Response({"info":"Reset token has expired"},status=status.HTTP_400_BAD_REQUEST)

        staff = Staff.objects.filter(Email__iexact=email).first()
        admin = Admin.objects.filter(Email__iexact=email).first()

        if staff:
            staff.password = make_password(new_password)
            staff.auth = None
            staff.refresh = None
            staff.save()
        elif admin:
            admin.password = make_password(new_password)
            admin.auth = None
            admin.save()
        else:
            return Response({"info":"User not found"},status=status.HTTP_404_NOT_FOUND)

        record.is_used = True
        record.save()

        return Response({"info":"Password reset successfully"},status=status.HTTP_200_OK)

class ArrivalCLS(APIView):
    def post(self,request):
        # get the staff that needs to add the time  
        staff_cookie=request.COOKIES.get("refresh_cookie")
        if not staff_cookie:
            return Response({"info":"Unable to Parse Cookie"},status=403)
        staff=Staff.objects.filter(refresh=staff_cookie).first()
        if not staff:
            return Response({"info":"Please Login"},status=400)
        # get the infomation based on the response
        serializer=ArrivalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"info":serializer.errors},status=400)

        serializer.save(staff=staff)
        return Response({"info":"Staff Arrival  Added Successfully"},status=200)


class AttendanceStatus(APIView):
    def get(self, request):
        staff = authenticate_staff(request)
        if not staff:
            return Response({"info": "Unable to Authenticate"}, status=status.HTTP_400_BAD_REQUEST)
        today = timezone.now().date()
        record = Arrival.objects.filter(staff=staff, date=today).first()
        data = None
        if record:
            data = {
                "time_of_arrival": record.time_of_arrival.strftime("%H:%M") if record.time_of_arrival else None,
                "time_of_leave": record.time_of_leave.strftime("%H:%M") if record.time_of_leave else None,
                "day": record.day,
                "date": str(record.date),
            }
        return Response({"info": "ok", "date": str(today), "attendance": data}, status=status.HTTP_200_OK)


class AttendanceCheckIn(APIView):
    def post(self, request):
        staff = authenticate_staff(request)
        if not staff:
            return Response({"info": "Unable to Authenticate"}, status=status.HTTP_400_BAD_REQUEST)
        today = timezone.now().date()
        if Arrival.objects.filter(staff=staff, date=today).exists():
            return Response({"info": "Already checked in for today"}, status=status.HTTP_400_BAD_REQUEST)
        Arrival.objects.create(
            staff=staff,
            time_of_arrival=timezone.now().time(),
            date=today,
            day=today.strftime("%A"),
        )
        return Response({"info": "Signed in successfully"}, status=status.HTTP_200_OK)


class AttendanceCheckOut(APIView):
    def post(self, request):
        staff = authenticate_staff(request)
        if not staff:
            return Response({"info": "Unable to Authenticate"}, status=status.HTTP_400_BAD_REQUEST)
        today = timezone.now().date()
        now = timezone.now().time()
        record = Arrival.objects.filter(staff=staff, date=today).first()
        if record:
            record.time_of_leave = now
            record.save()
        else:
            Arrival.objects.create(
                staff=staff,
                time_of_leave=now,
                date=today,
                day=today.strftime("%A"),
            )
        return Response({"info": "Signed out successfully"}, status=status.HTTP_200_OK)


class AdminAttendanceHistory(APIView):
    def get(self, request):
        auth = request.headers.get("Authorization")
        if not auth:
            return Response({"info": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        admin = Admin.objects.filter(auth=auth).first()
        if not admin:
            return Response({"info": "Invalid admin session"}, status=status.HTTP_401_UNAUTHORIZED)
        records = []
        for a in Arrival.objects.select_related("staff").order_by("-date", "staff__Name"):
            if not a.staff:
                continue
            records.append({
                "id": a.id,
                "staff_id": a.staff.id,
                "Name": a.staff.Name,
                "dpt": a.staff.dpt,
                "photo": a.staff.photo,
                "date": str(a.date),
                "day": a.day,
                "time_of_arrival": a.time_of_arrival.strftime("%H:%M") if a.time_of_arrival else None,
                "time_of_leave": a.time_of_leave.strftime("%H:%M") if a.time_of_leave else None,
            })
        return Response({"info": "ok", "records": records}, status=status.HTTP_200_OK)