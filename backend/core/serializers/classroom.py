from rest_framework import serializers

from ..models import ClassRoom, School


class ClassRoomSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    class Meta:
        model = ClassRoom
        fields = [
            "id",
            "school",
            "name",
            "grade",
        ]
        read_only_fields = [
            "id",
            "school",
        ]

    def validate(self, attrs):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required."
            )

        if request.user.is_superuser:
            return attrs

        profile = getattr(request.user, "profile", None)

        if not profile or not profile.school_id:
            raise serializers.ValidationError(
                "Your account is not associated with a school."
            )

        name = attrs.get("name")

        if name:
            exists = ClassRoom.objects.filter(
                school_id=profile.school_id,
                name=name,
            ).exists()

            if self.instance:
                exists = ClassRoom.objects.filter(
                    school_id=profile.school_id,
                    name=name,
                ).exclude(
                    pk=self.instance.pk
                ).exists()

            if exists:
                raise serializers.ValidationError(
                    {
                        "name": (
                            "A classroom with this name "
                            "already exists in your school."
                        )
                    }
                )

        return attrs