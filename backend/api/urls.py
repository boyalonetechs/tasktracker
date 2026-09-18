from django.urls import path
from . import views

urlpatterns = [
    #  the auth signup  and login
    path("auth/signup/",views.Signup.as_view(),name="signup"),
    path("auth/login/",views.Login.as_view(), name="login"),
    # get the email of the whole staffs
    path("auth/login/emails/",views.Login.as_view(), name="login_emails"),
    
    path("auth/forgot-password/", views.ForgotPasswordView.as_view(), name="forgot_password"),
    path("auth/verify-otp/", views.VerifyOTPView.as_view(), name="verify_otp"),
    path("auth/reset-password/", views.ResetPasswordView.as_view(), name="reset_password"),
    
    path("task/",views.Task.as_view(),name="task"),
    path("task/<int:id>/",views.Task.as_view(),name="task_detail"),
    path("task/<int:id>/move/",views.TaskMoveView.as_view(),name="task_move"),
    path("history/",views.History.as_view(),name="history"),
        
    path("director/task/",views.DirectorTaskView.as_view(),name="director_task"),
    path("director/history/",views.DirectorHistoryView.as_view(),name="director_history"),
    path("director/tasks/",views.AllStaffTasksView.as_view(),name="all_staff_tasks"),

    path("admin/login/",views.AdminLogin.as_view(),name="admin_login"),
    path("admin/dashboard/",views.AdminDashboard.as_view(),name="admin_dashboard"),
    path("admin/staff/",views.AdminStaffList.as_view(),name="admin_staff_list"),
    path("admin/staff/<int:staff_id>/",views.AdminStaffDetail.as_view(),name="admin_staff_detail"),
    path("auth/profile/",views.ProfileUpdate.as_view(),name="profile_update"),
    path("auth/profile/photo/",views.ProfilePhotoUpload.as_view(),name="profile_photo"),

    path("arrival/",views.ArrivalCLS.as_view(),name="arrival_depature"),

    path("attendance/",views.AttendanceStatus.as_view(),name="attendance_status"),
    path("attendance/checkin/",views.AttendanceCheckIn.as_view(),name="attendance_checkin"),
    path("attendance/checkout/",views.AttendanceCheckOut.as_view(),name="attendance_checkout"),
    path("admin/attendance/",views.AdminAttendanceHistory.as_view(),name="admin_attendance_history"),

    path("account/settings/",views.AccountSettings.as_view(),name="account_settings"),
    
]
