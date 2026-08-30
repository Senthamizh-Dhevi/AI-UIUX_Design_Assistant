const generateDesign = async (projectData) => {
  const response = await fetch(
    "http://localhost:5000/api/generate-design",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(projectData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to generate design."
    );
  }

  return {
    ...data,

    platform: projectData.platform,

    audience: projectData.audience,

    designStyle:
      data.designSystem?.style ||
      projectData.style,
  };
};

export default generateDesign;