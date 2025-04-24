import uuid
from datetime import timedelta

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from .serializers import UserSerializer, RegisterSerializer
from .models import EmailVerificationToken, PasswordResetToken

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                email = serializer.validated_data['email']
                print(f"'{email}'")
                if User.objects.filter(email=email).exists():
                    print("already exists")
                    return Response(
                        {
                            "exists": True, 
                            "message": "Пользователь с таким email уже зарегистрирован"
                        },
                        status=status.HTTP_200_OK
                    )
                print("creating")
                user = User.objects.create_user(
                    username=serializer.validated_data['email'],
                    email=email,
                    password=serializer.validated_data['password']
                )
                verification_token = EmailVerificationToken.objects.create(user=user)
                
                verification_url = f"{settings.SITE_URL}/verify-email/{verification_token.token}"
                print(verification_url)
                
                send_mail(
                    'Подтверждение регистрации',
                    f'Для подтверждения вашего email и активации аккаунта, пожалуйста, перейдите по ссылке: {verification_url}',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                return Response(
                    {"exists": False, "message": "Регистрация успешна. Проверьте email для подтверждения аккаунта."},
                    status=status.HTTP_201_CREATED
                )
                # return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response({'password': e.messages}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, token):
        try:
            verification = EmailVerificationToken.objects.get(token=token, is_verified=False)
            
            if verification.created_at < timezone.now() - timedelta(hours=24):
                return Response(
                    {"error": "Срок действия ссылки для подтверждения истек. Запросите новую."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = verification.user
            user.is_active = True
            user.save()

            verification.is_verified = True
            verification.save()
            
            return Response(
                {"message": "Email успешно подтвержден. Теперь вы можете войти в систему."},
                status=status.HTTP_200_OK
            )
            
        except EmailVerificationToken.DoesNotExist:
            return Response(
                {"error": "Неверный или уже использованный токен подтверждения."},
                status=status.HTTP_400_BAD_REQUEST
            )

class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({"error": "Email обязателен"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email, is_active=False)
            
            try:
                verification = EmailVerificationToken.objects.get(user=user)
                verification.token = uuid.uuid4()
                verification.created_at = timezone.now()
                verification.save()
            except EmailVerificationToken.DoesNotExist:
                verification = EmailVerificationToken.objects.create(user=user)
                
            verification_url = f"{settings.SITE_URL}/verify-email/{verification.token}"
            
            send_mail(
                'Подтверждение регистрации',
                f'Для подтверждения вашего email и активации аккаунта, пожалуйста, перейдите по ссылке: {verification_url}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            return Response(
                {"message": "Письмо с подтверждением отправлено повторно."},
                status=status.HTTP_200_OK
            )

        except User.DoesNotExist:
            # Не раскрываем есть ли пользователь
            return Response(
                {"message": "Письмо с подтверждением отправлено повторно."},
                status=status.HTTP_200_OK
            )

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            
            reset_token = PasswordResetToken.objects.create(user=user)
            
            reset_url = f"{settings.SITE_URL}/reset-password/{reset_token.token}"
            
            send_mail(
                'Восстановление пароля',
                f'Для сброса пароля перейдите по ссылке: {reset_url}\nСсылка действительна в течение 24 часов.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            return Response(
                {"message": "Инструкции по сбросу пароля отправлены на вашу почту."},
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            return Response(
                {"message": "Письмо с восстановалением отправлено."},
                status=status.HTTP_200_OK
            )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not (token and new_password):
            return Response(
                {"error": "Токен и новый пароль обязательны"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            reset_token = PasswordResetToken.objects.get(
                token=token,
                is_used=False,
                created_at__gt=timezone.now() - timedelta(hours=24)
            )
            
            user = reset_token.user
            
            user.set_password(new_password)
            user.save()
            
            reset_token.is_used = True
            reset_token.save()
            
            return Response(
                {"message": "Пароль успешно изменен. Теперь вы можете войти с новым паролем."},
                status=status.HTTP_200_OK
            )
            
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"error": "Неверный или истекший токен сброса пароля."},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
