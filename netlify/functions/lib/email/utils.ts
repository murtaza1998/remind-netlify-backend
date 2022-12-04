// substitutes variables in the template with format {{variableName}}
export const substituteEmailTemplateParams = <T extends Record<string, string>>(
  template: string,
  props: T
) => {
  const keys = Object.keys(props);

  let templateWithSubstitutedVariables = template;

  keys.forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    templateWithSubstitutedVariables = templateWithSubstitutedVariables.replace(
      regex,
      props[key]
    );
  });

  return templateWithSubstitutedVariables;
};

export const generateRandomId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};
