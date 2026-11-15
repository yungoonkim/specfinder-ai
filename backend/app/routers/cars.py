from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import CarDetail, CarFacets, CarFilters, CarItem, PageResult
from app.services.car_search import car_facets, get_car, search_cars

router = APIRouter(prefix="/api/cars", tags=["cars"])


@router.get("/facets", response_model=CarFacets)
def facets(db: Annotated[Session, Depends(get_db)]):
    return car_facets(db)


@router.get("/{listing_id}", response_model=CarDetail)
def detail(listing_id: str, db: Annotated[Session, Depends(get_db)]):
    result = get_car(db, listing_id)
    if result is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "매물을 찾을 수 없습니다."})
    return result


@router.get("", response_model=PageResult[CarItem])
def search(params: Annotated[CarFilters, Depends()], db: Annotated[Session, Depends(get_db)]):
    return search_cars(db, params)
