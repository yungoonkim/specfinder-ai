from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import NotebookDetail, NotebookFacets, NotebookFilters, NotebookItem, PageResult
from app.services.notebook_search import get_notebook, notebook_facets, search_notebooks

router = APIRouter(prefix="/api/notebooks", tags=["notebooks"])


@router.get("/facets", response_model=NotebookFacets)
def facets(db: Annotated[Session, Depends(get_db)]):
    return notebook_facets(db)


@router.get("/{product_code}", response_model=NotebookDetail)
def detail(product_code: int, db: Annotated[Session, Depends(get_db)]):
    result = get_notebook(db, product_code)
    if result is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "상품을 찾을 수 없습니다."})
    return result


@router.get("", response_model=PageResult[NotebookItem])
def search(params: Annotated[NotebookFilters, Query()], db: Annotated[Session, Depends(get_db)]):
    return search_notebooks(db, params)
