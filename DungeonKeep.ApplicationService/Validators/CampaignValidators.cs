using DungeonKeep.ApplicationService.Contracts;
using FluentValidation;

namespace DungeonKeep.ApplicationService.Validators;

public sealed class CreateCampaignRequestValidator : AbstractValidator<CreateCampaignRequest>
{
    public CreateCampaignRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Campaign name is required.")
            .MaximumLength(200).WithMessage("Campaign name must not exceed 200 characters.");

        RuleFor(x => x.LevelStart)
            .InclusiveBetween(1, 20).WithMessage("Starting level must be between 1 and 20.");

        RuleFor(x => x.LevelEnd)
            .InclusiveBetween(1, 20).WithMessage("Ending level must be between 1 and 20.")
            .GreaterThanOrEqualTo(x => x.LevelStart).WithMessage("Ending level must be greater than or equal to starting level.");
    }
}

public sealed class UpdateCampaignRequestValidator : AbstractValidator<UpdateCampaignRequest>
{
    public UpdateCampaignRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Campaign name is required.")
            .MaximumLength(200).WithMessage("Campaign name must not exceed 200 characters.");

        RuleFor(x => x.LevelStart)
            .InclusiveBetween(1, 20).WithMessage("Starting level must be between 1 and 20.");

        RuleFor(x => x.LevelEnd)
            .InclusiveBetween(1, 20).WithMessage("Ending level must be between 1 and 20.")
            .GreaterThanOrEqualTo(x => x.LevelStart).WithMessage("Ending level must be greater than or equal to starting level.");
    }
}

public sealed class CreateCampaignThreadRequestValidator : AbstractValidator<CreateCampaignThreadRequest>
{
    public CreateCampaignThreadRequestValidator()
    {
        RuleFor(x => x.Text)
            .NotEmpty().WithMessage("Thread text is required.")
            .MaximumLength(2000).WithMessage("Thread text must not exceed 2000 characters.");

        RuleFor(x => x.Visibility)
            .NotEmpty().WithMessage("Thread visibility is required.");
    }
}

public sealed class UpdateCampaignThreadRequestValidator : AbstractValidator<UpdateCampaignThreadRequest>
{
    public UpdateCampaignThreadRequestValidator()
    {
        RuleFor(x => x.Text)
            .NotEmpty().WithMessage("Thread text is required.")
            .MaximumLength(2000).WithMessage("Thread text must not exceed 2000 characters.");

        RuleFor(x => x.Visibility)
            .NotEmpty().WithMessage("Thread visibility is required.");
    }
}

public sealed class InviteCampaignMemberRequestValidator : AbstractValidator<InviteCampaignMemberRequest>
{
    public InviteCampaignMemberRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(256).WithMessage("Email must not exceed 256 characters.");
    }
}

public sealed class CreateCampaignSessionRequestValidator : AbstractValidator<CreateCampaignSessionRequest>
{
    public CreateCampaignSessionRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Session title is required.")
            .MaximumLength(200).WithMessage("Session title must not exceed 200 characters.");
    }
}

public sealed class UpdateCampaignSessionRequestValidator : AbstractValidator<UpdateCampaignSessionRequest>
{
    public UpdateCampaignSessionRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Session title is required.")
            .MaximumLength(200).WithMessage("Session title must not exceed 200 characters.");
    }
}

public sealed class CreateCampaignNpcRequestValidator : AbstractValidator<CreateCampaignNpcRequest>
{
    public CreateCampaignNpcRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("NPC name is required.")
            .MaximumLength(200).WithMessage("NPC name must not exceed 200 characters.");
    }
}

public sealed class CreateCampaignWorldNoteRequestValidator : AbstractValidator<CreateCampaignWorldNoteRequest>
{
    public CreateCampaignWorldNoteRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("World note title is required.")
            .MaximumLength(200).WithMessage("World note title must not exceed 200 characters.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("World note category is required.");
    }
}

public sealed class UpdateCampaignWorldNoteRequestValidator : AbstractValidator<UpdateCampaignWorldNoteRequest>
{
    public UpdateCampaignWorldNoteRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("World note title is required.")
            .MaximumLength(200).WithMessage("World note title must not exceed 200 characters.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("World note category is required.");
    }
}
