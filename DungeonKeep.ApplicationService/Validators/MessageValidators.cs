using DungeonKeep.ApplicationService.Contracts;
using FluentValidation;

namespace DungeonKeep.ApplicationService.Validators;

public sealed class SendMessageRequestValidator : AbstractValidator<SendMessageRequest>
{
    public SendMessageRequestValidator()
    {
        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Message body is required.")
            .MaximumLength(4000).WithMessage("Message body must not exceed 4000 characters.");
    }
}

public sealed class ComposeMessageRequestValidator : AbstractValidator<ComposeMessageRequest>
{
    public ComposeMessageRequestValidator()
    {
        RuleFor(x => x.RecipientUserId)
            .NotEmpty().WithMessage("Recipient is required.");

        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Message body is required.")
            .MaximumLength(4000).WithMessage("Message body must not exceed 4000 characters.");
    }
}
