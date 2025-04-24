from rest_framework import serializers
from django.contrib.auth.models import User
from .models import EmailVerificationToken

class UserSerializer(serializers.ModelSerializer):
    email_verified = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'email_verified']
    
    def get_email_verified(self, obj):
        try:
            return obj.verification_token.is_verified
        except EmailVerificationToken.DoesNotExist:
            return False

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password']
