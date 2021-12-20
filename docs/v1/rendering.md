# Rendering

Rendering of the cells is handled in the definition of each table column and can be done in one of three ways:

- [Numerical Data Rendering](/columns#numerical-render-optional)
- [Custom Rendering](/columns#custom-render-optional)
- [Path-to-Data Rendering](/columns#path-render-optional)

?> Only one of these methods should be added to the column's definition. But, there are use-cases where it can be beneficial to also include the `dataIndex` field (see below).

If more than one of these methods is provided in the column definition, then only one is used. The priority of the render methods is as follows:

1. [Numerical Data Render](/columns#numerical-render-optional) via the `numerical` field
2. [Custom Render](/columns#custom-render-optional) via the `render` field
3. [Path-to-Data Render](/columns#path-render-optional) via the `dataIndex` field

?> This allows you to use the `dataIndex` field for specifying where the data can be found for filtering, sorting and more. This means you can simplify those which would have the same value as the `dataIndex` by changing their values (or `[field].path` values) to `true`. When doing so, it defaults to the value of `dataIndex`. This could help save on duplicated code and having to maintain different places that are the same value.
