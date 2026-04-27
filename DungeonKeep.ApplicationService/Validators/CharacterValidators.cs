using DungeonKeep.ApplicationService.Contracts;
using FluentValidation;

namespace DungeonKeep.ApplicationService.Validators;

public sealed class CreateCharacterRequestValidator : AbstractValidator<CreateCharacterRequest>
{
    public CreateCharacterRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Character name is required.")
            .MaximumLength(200).WithMessage("Character name must not exceed 200 characters.");

        RuleFor(x => x.ClassName)
            .NotEmpty().WithMessage("Character class is required.")
            .MaximumLength(100).WithMessage("Character class must not exceed 100 characters.");

        RuleFor(x => x.Level)
            .InclusiveBetween(1, 20).WithMessage("Level must be between 1 and 20.");
    }
}

public sealed class UpdateCharacterRequestValidator : AbstractValidator<UpdateCharacterRequest>
{
    public UpdateCharacterRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Character name is required.")
            .MaximumLength(200).WithMessage("Character name must not exceed 200 characters.");

        RuleFor(x => x.ClassName)
            .NotEmpty().WithMessage("Character class is required.")
            .MaximumLength(100).WithMessage("Character class must not exceed 100 characters.");

        RuleFor(x => x.Level)
            .InclusiveBetween(1, 20).WithMessage("Level must be between 1 and 20.");
    }
}

public sealed class GenerateCharacterBackstoryRequestValidator : AbstractValidator<GenerateCharacterBackstoryRequest>
{
    public GenerateCharacterBackstoryRequestValidator()
    {
        RuleFor(x => x.ClassName)
            .NotEmpty().WithMessage("Character class is required.");
    }
}

public sealed class GenerateCharacterPortraitRequestValidator : AbstractValidator<GenerateCharacterPortraitRequest>
{
    public GenerateCharacterPortraitRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Character name is required.");

        RuleFor(x => x.ClassName)
            .NotEmpty().WithMessage("Character class is required.");
    }
}

public sealed class UpdateCharacterStatusRequestValidator : AbstractValidator<UpdateCharacterStatusRequest>
{
    public UpdateCharacterStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required.");
    }
}
