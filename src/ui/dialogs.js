// Diálogos propios: no dependen de window.prompt y funcionan también en Electron.
export function chooseDialog({ title, message, choices, initialValue }) {
  return new Promise((resolve) => {
    const previous = document.activeElement,
      dialog = document.createElement("dialog"),
      form = document.createElement("form");
    form.method = "dialog";
    form.className = "dialog-shell";
    const heading = document.createElement("h2");
    heading.id = "choice-dialog-title";
    heading.textContent = title;
    dialog.setAttribute("aria-labelledby", heading.id);
    const description = document.createElement("p");
    description.textContent = message || "";
    form.append(heading, description);
    let input;
    if (initialValue !== undefined) {
      const label = document.createElement("label");
      label.className = "field";
      label.textContent = title;
      input = document.createElement("input");
      input.value = initialValue;
      input.maxLength = 200;
      label.append(input);
      form.append(label);
    }
    const actions = document.createElement("div");
    actions.className = "dialog-actions";
    for (const choice of choices) {
      const button = document.createElement("button");
      button.value = choice.value;
      button.textContent = choice.label;
      button.className = choice.primary ? "primary" : "secondary";
      actions.append(button);
    }
    form.append(actions);
    dialog.append(form);
    document.body.append(dialog);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      const result = {
        choice: dialog.returnValue || "cancel",
        value: input?.value,
      };
      dialog.remove();
      if (previous?.isConnected) previous.focus();
      resolve(result);
    };
    dialog.dataset.privateDialog = "true";
    dialog.addEventListener(
      "private-dismiss",
      () => {
        dialog.close("cancel");
        finish();
      },
      { once: true },
    );
    dialog.addEventListener("close", finish, { once: true });
    dialog.showModal();
    if (input) {
      input.focus();
      input.select();
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          dialog.close("save");
        }
      });
    }
  });
}
export async function promptText(title, initialValue = "") {
  const result = await chooseDialog({
    title,
    initialValue,
    choices: [
      { value: "cancel", label: "Cancelar" },
      { value: "save", label: "Guardar", primary: true },
    ],
  });
  return result.choice === "save" ? result.value : null;
}
