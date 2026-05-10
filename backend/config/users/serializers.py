from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from dj_rest_auth.serializers import PasswordResetSerializer
from users.forms import CustomPasswordResetForm

User = get_user_model()

class CustomPasswordResetSerializer(PasswordResetSerializer):
    password_reset_form_class = CustomPasswordResetForm

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'password2', 
                  'phone', 'company', 'address1', 'address2', 'city', 
                  'country', 'province', 'postal_code')
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )
        # Обновляем дополнительные поля
        optional_fields = ['phone', 'company', 'address1', 'address2', 'city', 
                          'country', 'province', 'postal_code']
        for field in optional_fields:
            if field in validated_data:
                setattr(user, field, validated_data[field])
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        print(f"Validating: email={email}, password provided={bool(password)}")
        
        if email and password:
            user = authenticate(request=self.context.get('request'), 
                              username=email, password=password)
            if not user:
                print("Authentication failed: user not found")
                raise serializers.ValidationError("Invalid email or password.")
            if not user.is_active:
                print("Authentication failed: user inactive")
                raise serializers.ValidationError("This account is inactive.")
            print(f"Authentication successful: user={user.email}")
        else:
            print("Missing username or password")
            raise serializers.ValidationError("Must include 'username' and 'password'.")
        
        attrs['user'] = user
        return attrs
    
        #if username and password:
        #    user = authenticate(request=self.context.get('request'), 
        #                      username=username, password=password)
        #    if not user:
        #        raise serializers.ValidationError("Invalid email or password.")
        #    if not user.is_active:
        #        raise serializers.ValidationError("This account is inactive.")
        #else:
        #    raise serializers.ValidationError("Must include 'username' and 'password'.")
        
        #attrs['user'] = user
        #return attrs


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'phone', 'company', 
                  'address1', 'address2', 'city', 'country', 
                  'province', 'postal_code')


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 
                  'phone', 'company', 'address1', 'address2', 'city', 
                  'country', 'province', 'postal_code', 'date_joined')
        read_only_fields = ('id', 'date_joined')