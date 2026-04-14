function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const details = result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details,
        });
      }
      req.validatedBody = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validate };
